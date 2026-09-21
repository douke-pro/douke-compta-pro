'use strict';

const path = require('path');
const ExcelJS = require('exceljs');

const TEMPLATE_PATH = path.join(__dirname, '..', 'backups', 'EF_SYSCEBNL_Juin (1).xlsx');

function isFormulaCell(cell) {
    return Boolean(cell && cell.value && typeof cell.value === 'object' &&
        (cell.value.formula || cell.value.sharedFormula));
}

// FIX (21/09/2026) : ExcelJS n'exécute aucun moteur de calcul. Une cellule à
// formule conserve son ancien résultat mis en cache (celui de l'entité
// d'origine du gabarit) tant qu'aucune application ne la recalcule
// explicitement — vérifié : ni le drapeau fullCalcOnLoad, ni une conversion
// LibreOffice headless ne déclenchent ce recalcul automatiquement. On
// conserve donc la formule (traçabilité, recalcul correct si l'utilisateur
// modifie une cellule dans Excel par la suite) MAIS on fige aussi, dans le
// même appel, le résultat déjà connu et fiable (calculé par
// sycebnlMapper.js) comme valeur en cache, pour que le fichier affiche les
// bons chiffres dès l'ouverture, sans dépendre du comportement de
// recalcul de l'application qui l'ouvre.
function setCellValue(worksheet, address, value) {
    if (value === undefined || value === null) return;
    const cell = worksheet.getCell(address);
    if (isFormulaCell(cell)) {
        // Objet formule conserve tel quel (formules partagees incluses) : seul le resultat change.
        cell.value = Object.assign({}, cell.value, { result: value });
    } else {
        cell.value = value;
    }
}

// Alias conservé pour compatibilité de lecture du code : le comportement
// legacy ("ne jamais toucher une cellule à formule") a été remplacé
// partout par setCellValue ci-dessus.
const setIfInputCell = setCellValue;

// Ecrit une valeur littérale dans une cellule d'identité (PAGE DE GARDE), en
// écrasant délibérément tout contenu existant (y compris une formule cassée
// du type =_soNom) : cf. audit du 21/09/2026, les 45 noms définis métier du
// classeur officiel ont été perdus lors d'un précédent passage par ExcelJS
// (ExcelJS ne préserve pas les noms définis à valeur littérale). On écrit
// donc directement dans les cellules réelles plutôt que de dépendre de noms
// définis, mécanisme prouvé fragile.
function setIdentityCell(worksheet, address, value) {
    worksheet.getCell(address).value = value !== undefined && value !== null ? value : '';
}

function indexRowsByRef(worksheet, refColumn) {
    const rows = new Map();
    worksheet.eachRow((row, rowNumber) => {
        const ref = row.getCell(refColumn).value;
        if (typeof ref === 'string' && ref.trim()) rows.set(ref.trim(), rowNumber);
    });
    return rows;
}

function fillBilan(workbook, reportData) {
    const worksheet = workbook.getWorksheet('BILAN');
    if (!worksheet) throw new Error('Le modèle SYCEBNL ne contient pas la feuille BILAN.');
    const actifRows = indexRowsByRef(worksheet, 1);
    const passifRows = indexRowsByRef(worksheet, 8);
    for (const ligne of reportData.bilan?.actif || []) {
        const row = actifRows.get(ligne.ref);
        if (!row) continue;
        setIfInputCell(worksheet, `D${row}`, ligne.brut);
        setIfInputCell(worksheet, `E${row}`, ligne.amort);
        setIfInputCell(worksheet, `F${row}`, ligne.net);
        setIfInputCell(worksheet, `G${row}`, ligne.net_n1);
    }
    for (const ligne of reportData.bilan?.passif || []) {
        const row = passifRows.get(ligne.ref);
        if (!row) continue;
        setIfInputCell(worksheet, `K${row}`, ligne.net);
        setIfInputCell(worksheet, `L${row}`, ligne.net_n1);
    }
}

function fillResultat(workbook, reportData) {
    const worksheet = workbook.getWorksheet('COMPTE_DE_RESULTAT');
    if (!worksheet) throw new Error('Le modèle SYCEBNL ne contient pas la feuille COMPTE_DE_RESULTAT.');
    const rows = indexRowsByRef(worksheet, 1);
    for (const ligne of reportData.compte_resultat?.lignes || []) {
        const row = rows.get(ligne.ref);
        if (!row) continue;
        setIfInputCell(worksheet, `D${row}`, ligne.montant_n);
        setIfInputCell(worksheet, `E${row}`, ligne.montant_n1);
    }
}

function fillTft(workbook, reportData) {
    const worksheet = workbook.getWorksheet('TFT');
    if (!worksheet) throw new Error('Le modèle SYCEBNL ne contient pas la feuille TFT.');
    const rows = indexRowsByRef(worksheet, 1);
    for (const ligne of reportData.tft?.lignes || []) {
        const row = rows.get(ligne.ref);
        if (!row) continue;
        setIfInputCell(worksheet, `E${row}`, ligne.montant_n);
        // FIX (21/09/2026) : montant_n1 est désormais fourni par
        // sycebnlReportAdapter.js (voir buildReportData) — avant cette
        // correction ce champ était toujours undefined et la colonne N-1
        // du TFT gardait indéfiniment les chiffres de l'entité du gabarit.
        setIfInputCell(worksheet, `F${row}`, ligne.montant_n1);
    }
}

// Convertit une date au format Odoo (YYYY-MM-DD) vers le format d'affichage
// français attendu par le classeur (DD/MM/YYYY). Si le format est déjà autre
// chose (ou absent), la valeur est retournée telle quelle plutôt que d'être
// devinée.
function toFrenchDate(isoLike) {
    if (!isoLike) return undefined;
    const m = String(isoLike).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return String(isoLike);
    return `${m[3]}/${m[2]}/${m[1]}`;
}

// Adresse composée à partir des SEULS champs réellement disponibles depuis
// res.company côté Odoo (cf. odooReportsService.getCompanyInfo :
// name, street, city, zip, country_id, phone, email, website, vat,
// company_registry, currency_id). Aucun champ "sigle" n'existe dans cette
// liste : le sigle n'est donc PAS renseigné automatiquement (voir
// fillIdentity) plutôt que d'être deviné à partir du nom.
function buildAddress(company) {
    const parts = [company.street, [company.zip, company.city].filter(Boolean).join(' ')].filter(Boolean);
    const countryName = Array.isArray(company.country_id) ? company.country_id[1] : company.country_id;
    if (countryName) parts.push(countryName);
    return parts.filter(Boolean).join(', ') || undefined;
}

/**
 * Renseigne les champs d'identité de la PAGE DE GARDE directement dans les
 * cellules réelles (E25, G20, D30, E32, B34), et non via des noms définis.
 *
 * Champs volontairement NON renseignés (aucune donnée source fiable) :
 *   - D30 (sigle) : `res.company` côté Odoo ne fournit aucun champ sigle.
 *     Laissé vide plutôt que de conserver ou deviner une valeur.
 */
function fillIdentity(workbook, company = {}, period = {}) {
    const worksheet = workbook.getWorksheet('PAGE DE GARDE');
    if (!worksheet) return;

    const name = company.name || company.company_name;
    const address = buildAddress(company) || company.street || company.address;
    const taxId = company.vat || company.tax_id;
    const end = toFrenchDate(period.end || period.period_end);

    setIdentityCell(worksheet, 'E25', name);
    setIdentityCell(worksheet, 'G20', end ? `Exercice clos le ${end}` : '');
    setIdentityCell(worksheet, 'D11', ''); // centre des impots : aucun champ Odoo ; ne plus afficher celui du gabarit
    setIdentityCell(worksheet, 'D30', ''); // sigle : pas de champ source, voir commentaire ci-dessus
    setIdentityCell(worksheet, 'E32', address);
    setIdentityCell(worksheet, 'B34', taxId ? `N° D'IDENTIFICATION FISCALE :     ${taxId}` : "N° D'IDENTIFICATION FISCALE :");
}

// Vide le resultat en cache de TOUTES les formules : celles que le mapper ne renseigne pas
// (totaux Brut/Amort...) sont recalculees a l'ouverture au lieu d'afficher les chiffres du gabarit.
function invalidateFormulaCaches(workbook) {
    workbook.eachSheet(ws => ws.eachRow(row => row.eachCell(cell => {
        if (isFormulaCell(cell)) cell.value = Object.assign({}, cell.value, { result: undefined });
    })));
}

async function buildSycebnlExcel(reportData, options = {}) {
    const templatePath = options.templatePath || TEMPLATE_PATH;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    invalidateFormulaCaches(workbook);
    fillIdentity(workbook, reportData.company, reportData.period);
    fillBilan(workbook, reportData);
    fillResultat(workbook, reportData);
    fillTft(workbook, reportData);
    workbook.calcProperties = Object.assign({}, workbook.calcProperties, { fullCalcOnLoad: true });
    return workbook.xlsx.writeBuffer();
}

module.exports = { buildSycebnlExcel, TEMPLATE_PATH };
