(async () => {
    // Mock test harness for controllers/closingController.finalizeClosing
    // This script overrides services to avoid touching real Odoo/Postgres.

    const path = require('path');
    const pool = require('../services/dbService');
    const fiscal = require('../services/fiscalYearService');
    const odoo = require('../services/odooService');

    // --- Backup real implementations to restore later if needed
    const realQueryWithRetry = pool.queryWithRetry;
    const realSnapshot = fiscal.snapshotFiscalYearBalances;
    const realOdooExecute = odoo.odooExecuteKw;

    // --- Simple in-memory mock behaviour
    pool.queryWithRetry = async (text, params) => {
        const t = String(text).trim();
        // Simulate SELECT status FROM fiscal_year_closings
        if (t.startsWith('SELECT status FROM fiscal_year_closings')) {
            return { rows: [{ status: 'locked' }] };
        }
        // Simulate UPDATE ... RETURNING * for closing
        if (t.includes("SET status = 'closed'") && t.includes('RETURNING')) {
            return { rows: [{ company_id: params[0], fiscal_year: params[1], status: 'closed' }] };
        }
        // Simulate audit insert
        if (t.startsWith('INSERT INTO closing_audit_log')) {
            return { rowCount: 1 };
        }
        // Fallback: log and return empty
        console.log('[mock pool.queryWithRetry] SQL:', t, 'PARAMS:', params);
        return { rows: [] };
    };

    fiscal.snapshotFiscalYearBalances = async (companyId, fiscalYear, performedBy) => {
        console.log(`[mock snapshot] company=${companyId} fiscal=${fiscalYear} by=${performedBy}`);
        // Simulate some delay
        await new Promise(r => setTimeout(r, 200));
        return { success: true, count: 142, fiscal_year: fiscalYear, snapshot_date: `${fiscalYear}-12-31` };
    };

    // Minimal odooExecuteKw mock to allow read/write calls if controller uses them
    odoo.odooExecuteKw = async (params) => {
        console.log('[mock odooExecuteKw] model=', params.model, 'method=', params.method);
        // For lock checks (read) return false for fiscalyear_lock_date when needed
        if (params.model === 'res.company' && params.method === 'read') {
            return [{ fiscalyear_lock_date: `${new Date().getFullYear()}-12-31` }];
        }
        return [];
    };

    // --- Require controller AFTER we've overridden service implementations
    const controller = require('../controllers/closingController');

    // --- Mock req/res
    const req = {
        validatedCompanyId: 3,
        body: { fiscal_year: 2026, notes: 'Test finalize mock' },
        user: { name: 'MockUser' },
        headers: {},
        socket: { remoteAddress: '127.0.0.1' }
    };

    const res = {
        _status: 200,
        status(code) { this._status = code; return this; },
        json(obj) { console.log('\n=== RESPONSE STATUS:', this._status, '===\n', JSON.stringify(obj, null, 2)); }
    };

    try {
        console.log('--- Running mock finalizeClosing test ---');
        await controller.finalizeClosing(req, res);
        console.log('--- Done ---');
    } catch (err) {
        console.error('Test failed:', err.message, err.stack);
    } finally {
        // restore
        pool.queryWithRetry = realQueryWithRetry;
        fiscal.snapshotFiscalYearBalances = realSnapshot;
        odoo.odooExecuteKw = realOdooExecute;
    }
})();
