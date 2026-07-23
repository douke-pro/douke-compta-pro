require('dotenv').config();
const { odooExecuteKw, ADMIN_UID_INT } = require('./services/odooService');

const TEST_COMPANY_ID = 1;

async function main() {
    console.log('🔍 VÉRIFICATION D\'INTÉGRITÉ — company_id=' + TEST_COMPANY_ID + '\n');
    let issues = 0;

    // 1. Comptes par défaut de la société (res.company)
    console.log('1/4 — Comptes par défaut de la société (res.company)...');
    const companyFields = [
        'name',
        'expense_currency_exchange_account_id',
        'income_currency_exchange_account_id',
        'account_journal_suspense_account_id',
        'account_journal_payment_debit_account_id',
        'account_journal_payment_credit_account_id',
        'account_default_pos_receivable_account_id',
        'income_account_id',
        'expense_account_id',
        'transfer_account_id',
        'account_sale_tax_id',
        'account_purchase_tax_id'
    ];
    const companies = await odooExecuteKw({
        uid: ADMIN_UID_INT,
        model: 'res.company',
        method: 'read',
        args: [[TEST_COMPANY_ID], companyFields],
        kwargs: {}
    });
    const company = companies[0];
    for (const field of companyFields) {
        if (field === 'name') continue;
        const val = company[field];
        if (!val) {
            console.log(`   ⚠️  ${field} : VIDE`);
            issues++;
        } else {
            console.log(`   ✅ ${field} : ${JSON.stringify(val)}`);
        }
    }

    // 2. Comptes par défaut des journaux (account.journal)
    console.log('\n2/4 — Comptes par défaut des journaux (account.journal)...');
    const journals = await odooExecuteKw({
        uid: ADMIN_UID_INT,
        model: 'account.journal',
        method: 'search_read',
        args: [[['company_id', '=', TEST_COMPANY_ID]]],
        kwargs: {
            fields: ['name', 'type', 'default_account_id', 'suspense_account_id', 'payment_debit_account_id', 'payment_credit_account_id'],
            context: { active_test: false }
        }
    });
    console.log(`   Journaux trouvés : ${journals.length}`);
    for (const j of journals) {
        const missing = [];
        if (!j.default_account_id) missing.push('default_account_id');
        if (['bank', 'cash'].includes(j.type)) {
            if (!j.suspense_account_id) missing.push('suspense_account_id');
        }
        if (missing.length > 0) {
            console.log(`   ⚠️  [${j.type}] ${j.name} — champs vides : ${missing.join(', ')}`);
            issues++;
        } else {
            console.log(`   ✅ [${j.type}] ${j.name} — OK`);
        }
    }

    // 3. Lignes de répartition des taxes (account.tax.repartition.line)
    console.log('\n3/4 — Répartition des taxes (account.tax.repartition.line)...');
    const taxes = await odooExecuteKw({
        uid: ADMIN_UID_INT,
        model: 'account.tax',
        method: 'search_read',
        args: [[['company_id', '=', TEST_COMPANY_ID]]],
        kwargs: { fields: ['name'], context: { active_test: false } }
    });
    console.log(`   Taxes trouvées : ${taxes.length}`);
    const taxIds = taxes.map(t => t.id);
    let taxIssues = 0;
    if (taxIds.length > 0) {
        const repLines = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.tax.repartition.line',
            method: 'search_read',
            args: [[['tax_id', 'in', taxIds], ['repartition_type', '=', 'tax']]],
            kwargs: { fields: ['tax_id', 'account_id'] }
        });
        for (const line of repLines) {
            if (!line.account_id) {
                console.log(`   ⚠️  Ligne de répartition sans compte — tax_id=${line.tax_id[0]} (${line.tax_id[1]})`);
                taxIssues++;
                issues++;
            }
        }
        if (taxIssues === 0) console.log('   ✅ Toutes les lignes de répartition de type "tax" ont un compte assigné.');
    }

    // 4. Comptes référencés par des écritures en BROUILLON (pas postées, mais existantes)
    console.log('\n4/4 — Comptes référencés par des écritures en brouillon (account.move.line)...');
    const draftLines = await odooExecuteKw({
        uid: ADMIN_UID_INT,
        model: 'account.move.line',
        method: 'search_read',
        args: [[['company_id', '=', TEST_COMPANY_ID], ['move_id.state', '=', 'draft']]],
        kwargs: { fields: ['account_id', 'move_id'], limit: 1000 }
    });
    console.log(`   Lignes en brouillon trouvées : ${draftLines.length}`);
    const orphanLines = draftLines.filter(l => !l.account_id);
    if (orphanLines.length > 0) {
        console.log(`   ⚠️  ${orphanLines.length} ligne(s) SANS compte assigné (orphelines) :`);
        orphanLines.slice(0, 10).forEach(l => console.log(`      - move_id=${l.move_id[0]} (${l.move_id[1]})`));
        issues += orphanLines.length;
    } else if (draftLines.length > 0) {
        console.log('   ✅ Toutes les lignes en brouillon ont un compte assigné.');
    } else {
        console.log('   ℹ️  Aucune ligne en brouillon à vérifier.');
    }

    // VERDICT
    console.log('\n============================================================');
    console.log('VERDICT');
    console.log('============================================================');
    if (issues === 0) {
        console.log('✅ Aucune anomalie détectée. La configuration comptable de la société semble intacte malgré le compte manquant.');
        console.log('   ➡️  Le compte disparu était probablement redondant ou non référencé.');
    } else {
        console.log(`⚠️  ${issues} anomalie(s) détectée(s) — voir le détail ci-dessus.`);
        console.log('   ➡️  Ne pas construire la fonctionnalité de changement de plan comptable avant d\'avoir corrigé/compris ces points.');
    }
}

main().catch(e => { console.error('🚨 ERREUR:', e.message); process.exit(1); });
