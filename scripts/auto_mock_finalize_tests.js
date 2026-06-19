"use strict";

// Script automatisé pour tester finalizeClosing en deux scénarios :
// 1) snapshot échoue -> réponse 500 et exercice reste 'locked'
// 2) snapshot réussit -> réponse 200 et exercice passe à 'closed'

const fs = require('fs');

async function runScenario(name, snapshotBehaviour) {
    const pool = require('../services/dbService');
    const fiscal = require('../services/fiscalYearService');
    const odoo = require('../services/odooService');

    // Backup
    const realQuery = pool.queryWithRetry;
    const realSnapshot = fiscal.snapshotFiscalYearBalances;
    const realOdoo = odoo.odooExecuteKw;

    // Mocks
    pool.queryWithRetry = async (text, params) => {
        const t = String(text).trim();
        if (t.startsWith('SELECT status FROM fiscal_year_closings')) {
            return { rows: [{ status: 'locked' }] };
        }
        if (t.includes("SET status = 'closed'") && t.includes('RETURNING')) {
            return { rows: [{ company_id: params[0], fiscal_year: params[1], status: 'closed' }] };
        }
        if (t.startsWith('INSERT INTO closing_audit_log')) return { rowCount: 1 };
        // default
        return { rows: [] };
    };

    fiscal.snapshotFiscalYearBalances = snapshotBehaviour;

    odoo.odooExecuteKw = async (params) => {
        if (params.model === 'res.company' && params.method === 'read') {
            return [{ fiscalyear_lock_date: `${new Date().getFullYear()}-12-31` }];
        }
        return [];
    };

    // Ensure controller is loaded fresh so it picks up our mocked service functions
    delete require.cache[require.resolve('../controllers/closingController')];
    const controller = require('../controllers/closingController');

    const req = {
        validatedCompanyId: 3,
        body: { fiscal_year: 2026, notes: `Auto-test ${name}` },
        user: { name: 'AutoTester' },
        headers: {},
        socket: { remoteAddress: '127.0.0.1' }
    };

    const resultCapture = { status: 0, body: null };
    const res = {
        _status: 200,
        status(code) { this._status = code; resultCapture.status = code; return this; },
        json(obj) { resultCapture.body = obj; console.log(`--- ${name} RESPONSE (${this._status}) ---`, JSON.stringify(obj)); }
    };

    try {
        await controller.finalizeClosing(req, res);
    } catch (err) {
        resultCapture.body = { status: 'error', error: err.message };
    } finally {
        // restore
        pool.queryWithRetry = realQuery;
        fiscal.snapshotFiscalYearBalances = realSnapshot;
        odoo.odooExecuteKw = realOdoo;
    }

    return resultCapture;
}

async function main() {
    const results = {};

    // Scenario 1: snapshot throws
    results.failure = await runScenario('snapshot_failure', async () => {
        await new Promise(r => setTimeout(r, 50));
        throw new Error('Simulated snapshot failure');
    });

    // Scenario 2: snapshot succeeds
    results.success = await runScenario('snapshot_success', async (companyId, fiscalYear, performedBy) => {
        await new Promise(r => setTimeout(r, 50));
        return { success: true, count: 142, fiscal_year: fiscalYear, snapshot_date: `${fiscalYear}-12-31` };
    });

    fs.writeFileSync('scripts/mock_finalize_tests_results.json', JSON.stringify(results, null, 2));
    console.log('\nWrote scripts/mock_finalize_tests_results.json');
}

main().catch(err => { console.error('Auto-test failed:', err); process.exit(2); });
