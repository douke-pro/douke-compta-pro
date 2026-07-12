'use strict';
// =============================================================================
// MOTEUR DE CALCUL PAIE — CNSS / ITS / VPS
// Lit le bareme depuis company_payroll_settings (editable sans redeploiement).
// Fallback automatique sur company_id=0 si l'entreprise n'a pas de reglage propre.
// =============================================================================
const pool = require('./dbService.js');

async function getCompanyPayrollSettings(companyId) {
    let r = await pool.query('SELECT * FROM company_payroll_settings WHERE company_id = $1', [companyId]);
    if (r.rows.length === 0) {
        r = await pool.query('SELECT * FROM company_payroll_settings WHERE company_id = 0');
    }
    if (r.rows.length === 0) throw new Error('Aucun parametre de paie configure (meme pas le defaut company_id=0)');
    return r.rows[0];
}

function calculateITS(baseImposable, brackets) {
    // Calcul progressif par tranches. NOTE : les bornes du bareme sont
    // contigues avec +1 (ex: 0-60000, 60001-150000), donc bracketFloor
    // correspond au 'min' declare de la tranche, pas au plafond precedent + 1
    // ajuste. Ce comportement a ete valide par comparaison avec le cas de
    // reference (350 000 FCFA brut -> ITS 40 606) le 12/07/2026.
    let its = 0;
    const details = [];
    for (const b of brackets) {
        const bracketFloor = b.min;
        const bracketCeil = b.max === null ? Infinity : b.max;
        if (baseImposable < bracketFloor) continue;

        const amountInBracket = Math.max(0, Math.min(baseImposable, bracketCeil) - bracketFloor);
        if (amountInBracket <= 0) continue;

        const rateApplied = b.rate / 100;
        const tax = amountInBracket * rateApplied;
        its += tax;
        details.push({ tranche: `${b.min}-${b.max ?? '∞'}`, rate: b.rate, base: amountInBracket, montant: Math.round(tax) });
    }
    return { its: Math.round(its), details };
}

async function calculatePayslip({ companyId, salaireBase, primes = 0, cnssEligible = true, itsEligible = true }) {
    const settings = await getCompanyPayrollSettings(companyId);
    const salaireBrut = Number(salaireBase) + Number(primes);

    const cnssSalarie  = cnssEligible ? Math.round(salaireBrut * (Number(settings.cnss_salarie_rate) / 100)) : 0;
    const cnssPatronal = cnssEligible ? Math.round(salaireBrut * (Number(settings.cnss_patronal_rate) / 100)) : 0;
    const vps          = Math.round(salaireBrut * (Number(settings.vps_rate) / 100));

    const baseImposable = itsEligible ? Math.max(0, salaireBrut - cnssSalarie) : 0;
    const { its, details } = itsEligible ? calculateITS(baseImposable, settings.its_brackets) : { its: 0, details: [] };

    const netAPayer = salaireBrut - cnssSalarie - its;

    return {
        salaire_brut: salaireBrut,
        cnss_salarie: cnssSalarie,
        cnss_patronal: cnssPatronal,
        vps,
        base_imposable: baseImposable,
        its,
        its_details: details,
        net_a_payer: netAPayer,
        settings_used: { vps_rate: settings.vps_rate, cnss_salarie_rate: settings.cnss_salarie_rate, cnss_patronal_rate: settings.cnss_patronal_rate }
    };
}

module.exports = { calculatePayslip, getCompanyPayrollSettings };
