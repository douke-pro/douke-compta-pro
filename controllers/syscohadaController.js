'use strict';

const pool           = require('../services/dbService');
const accountingCtrl = require('./accountingController');
const { computeActif, computePassif, computeResultat, computeTFT } = require('../services/syscohadaMapper');

async function fetchOdooBalance(companyId, date_from, date_to) {
    return new Promise((resolve, reject) => {
        const fakeReq = { validatedCompanyId: companyId, query: { companyId, date_from, date_to } };
        const fakeRes = {
            status: () => fakeRes,
            json: (data) => {
                if (data.status === 'success') resolve(data.data.accounts || []);
                else reject(new Error(data.error || 'Erreur balance Odoo'));
            },
        };
        accountingCtrl.getSyscohadaTrialBalance(fakeReq, fakeRes);
    });
}

async function fetchPrevYearBalances(companyId, year) {
    const prevYear = parseInt(year) - 1;
    const result = await pool.queryWithRetry(
        `SELECT account_code AS code, account_name AS name,
                balance_debit AS opening_debit, balance_credit AS opening_credit,
                0 AS debit, 0 AS credit
         FROM fiscal_year_balances
         WHERE company_id = $1 AND fiscal_year = $2`,
        [companyId, prevYear]
    );
    return result.rows || [];
}

exports.getBilan = async (req, res) => {
    try {
        const companyId = parseInt(req.query.companyId || req.validatedCompanyId);
        const { date_from, date_to, fiscal_year } = req.query;
        if (!companyId || !date_from || !date_to)
            return res.status(400).json({ status: 'error', error: 'companyId, date_from, date_to requis.' });

        const year = fiscal_year || new Date(date_to).getFullYear();
        const [balanceN, balanceN1] = await Promise.all([
            fetchOdooBalance(companyId, date_from, date_to),
            fetchPrevYearBalances(companyId, year),
        ]);
        const resultatLignes = computeResultat(balanceN, balanceN1);
        const resultatNet    = resultatLignes.find(l => l.ref === 'XI')?.montant_n || 0;
        const actif  = computeActif(balanceN, balanceN1);
        const passif = computePassif(balanceN, balanceN1, resultatNet);
        const totalActif  = actif.find(l  => l.ref === 'BZ')?.net || 0;
        const totalPassif = passif.find(l => l.ref === 'DZ')?.net || 0;
        const ecart = Math.abs(totalActif - totalPassif);

        res.status(200).json({ status: 'success', data: {
            meta: { company_id: companyId, fiscal_year: year, date_from, date_to, generated_at: new Date().toISOString(), ecart_bilan: ecart },
            actif, passif,
            totaux: { total_actif: totalActif, total_passif: totalPassif, ecart, equilibre: ecart <= 1 }
        }});
    } catch (error) {
        console.error('🚨 [getBilan]', error.message);
        res.status(500).json({ status: 'error', error: error.message });
    }
};

exports.getCompteResultat = async (req, res) => {
    try {
        const companyId = parseInt(req.query.companyId || req.validatedCompanyId);
        const { date_from, date_to, fiscal_year } = req.query;
        if (!companyId || !date_from || !date_to)
            return res.status(400).json({ status: 'error', error: 'companyId, date_from, date_to requis.' });

        const year = fiscal_year || new Date(date_to).getFullYear();
        const [balanceN, balanceN1] = await Promise.all([
            fetchOdooBalance(companyId, date_from, date_to),
            fetchPrevYearBalances(companyId, year),
        ]);
        const lignes     = computeResultat(balanceN, balanceN1);
        const resultatNet = lignes.find(l => l.ref === 'XI')?.montant_n || 0;

        res.status(200).json({ status: 'success', data: {
            meta: { company_id: companyId, fiscal_year: year, date_from, date_to, generated_at: new Date().toISOString() },
            lignes, resultat_net: resultatNet, benefice: resultatNet >= 0
        }});
    } catch (error) {
        console.error('🚨 [getCompteResultat]', error.message);
        res.status(500).json({ status: 'error', error: error.message });
    }
};

exports.getTFT = async (req, res) => {
    try {
        const companyId = parseInt(req.query.companyId || req.validatedCompanyId);
        const { date_from, date_to, fiscal_year } = req.query;
        if (!companyId || !date_from || !date_to)
            return res.status(400).json({ status: 'error', error: 'companyId, date_from, date_to requis.' });

        const year = fiscal_year || new Date(date_to).getFullYear();
        const [balanceN, balanceN1] = await Promise.all([
            fetchOdooBalance(companyId, date_from, date_to),
            fetchPrevYearBalances(companyId, year),
        ]);
        const resultatN   = computeResultat(balanceN, balanceN1);
        const resultatNet = resultatN.find(l => l.ref === 'XI')?.montant_n || 0;
        const actifN      = computeActif(balanceN, balanceN1);
        const passifN     = computePassif(balanceN, balanceN1, resultatNet);
        const actifN1     = computeActif(balanceN1, []);
        const passifN1    = computePassif(balanceN1, [], 0);
        const bilanN  = { actif: actifN,  passif: passifN,  resultat: resultatN };
        const bilanN1 = { actif: actifN1, passif: passifN1 };
        const lignes  = computeTFT(balanceN, bilanN, bilanN1);

        res.status(200).json({ status: 'success', data: {
            meta: { company_id: companyId, fiscal_year: year, date_from, date_to, generated_at: new Date().toISOString() },
            lignes, tresorerie_finale: lignes.find(l => l.ref === 'ZH')?.montant_n || 0
        }});
    } catch (error) {
        console.error('🚨 [getTFT]', error.message);
        res.status(500).json({ status: 'error', error: error.message });
    }
};

exports.getEtatsComplets = async (req, res) => {
    try {
        const companyId = parseInt(req.query.companyId || req.validatedCompanyId);
        const { date_from, date_to, fiscal_year } = req.query;
        if (!companyId || !date_from || !date_to)
            return res.status(400).json({ status: 'error', error: 'companyId, date_from, date_to requis.' });

        const year = fiscal_year || new Date(date_to).getFullYear();
        const [balanceN, balanceN1] = await Promise.all([
            fetchOdooBalance(companyId, date_from, date_to),
            fetchPrevYearBalances(companyId, year),
        ]);
        const resultatLignes = computeResultat(balanceN, balanceN1);
        const resultatNet    = resultatLignes.find(l => l.ref === 'XI')?.montant_n || 0;
        const actifN   = computeActif(balanceN, balanceN1);
        const passifN  = computePassif(balanceN, balanceN1, resultatNet);
        const actifN1  = computeActif(balanceN1, []);
        const passifN1 = computePassif(balanceN1, [], 0);
        const bilanN   = { actif: actifN, passif: passifN, resultat: resultatLignes };
        const bilanN1  = { actif: actifN1, passif: passifN1 };
        const tftLignes = computeTFT(balanceN, bilanN, bilanN1);
        const totalActif  = actifN.find(l  => l.ref === 'BZ')?.net || 0;
        const totalPassif = passifN.find(l => l.ref === 'DZ')?.net || 0;
        const ecart = Math.abs(totalActif - totalPassif);

        res.status(200).json({ status: 'success', data: {
            meta: { company_id: companyId, fiscal_year: year, date_from, date_to, generated_at: new Date().toISOString(), ecart_bilan: ecart, equilibre: ecart <= 1 },
            bilan: { actif: actifN, passif: passifN, totaux: { total_actif: totalActif, total_passif: totalPassif, ecart, equilibre: ecart <= 1 } },
            compte_resultat: { lignes: resultatLignes, resultat_net: resultatNet, benefice: resultatNet >= 0 },
            tft: { lignes: tftLignes, tresorerie_finale: tftLignes.find(l => l.ref === 'ZH')?.montant_n || 0 }
        }});
    } catch (error) {
        console.error('🚨 [getEtatsComplets]', error.message);
        res.status(500).json({ status: 'error', error: error.message });
    }
};
