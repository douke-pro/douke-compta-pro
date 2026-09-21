'use strict';

const path = require('path');
const fs = require('fs/promises');
const ExcelJS = require('exceljs');
const JSZip = require('jszip');

const TEMPLATE_PATH = path.join(__dirname, '..', 'backups', 'EF_SYSCEBNL_Juin (1).xlsx');

function isFormulaCell(cell) {
    return Boolean(cell && cell.value && typeof cell.value === 'object' &&
        (cell.value.formula || cell.value.sharedFormula));
}

function setIfInputCell(worksheet, address, value) {
    const cell = worksheet.getCell(address);
    if (!isFormulaCell(cell) && value !== undefined && value !== null) cell.value = value;
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
        setIfInputCell(worksheet, `F${row}`, ligne.montant_n1);
    }
}

function fillIdentity(workbook, company = {}, period = {}) {
    const name = company.name || company.company_name;
    const address = company.street || company.address;
    const taxId = company.vat || company.tax_id;
    const registration = company.company_registry || company.registration_number;
    const end = period.end || period.period_end;
    const start = period.start || period.period_start;
    return {
        _soNom: name,
        _soNom1: name ? `Désignation entité : ${name}` : undefined,
        _soNom2: name ? `DENOMINATION SOCIALE : ${name}` : undefined,
        _soAdr: address,
        _soAdr2: address ? `ADRESSE COMPLETE : ${address}` : undefined,
        _soNumFisc: taxId,
        _soNumFisc1: taxId ? `Numéro IFU : ${taxId}` : undefined,
        _soNumFisc2: taxId ? `N° D'IDENTIFICATION FISCALE : ${taxId}` : undefined,
        _soregCm: registration,
        _ExerClos: end ? `Exercice clos le ${end}` : undefined,
        _ExerFin: end ? ` ${end}` : undefined,
        _Period: start && end ? `Période du ${start} Au ${end}` : undefined,
    };
}

function xmlEscape(value) {
    return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
        .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function restoreDefinedNames(buffer, templatePath, values) {
    const [outputZip, templateZip] = await Promise.all([
        JSZip.loadAsync(buffer),
        fs.readFile(templatePath).then(data => JSZip.loadAsync(data)),
    ]);
    const templateWorkbook = await templateZip.file('xl/workbook.xml').async('string');
    const definedNamesMatch = templateWorkbook.match(/<definedNames>[\s\S]*?<\/definedNames>/);
    if (!definedNamesMatch) return buffer;

    let definedNames = definedNamesMatch[0];
    for (const [name, value] of Object.entries(values)) {
        if (value === undefined || value === null) continue;
        const pattern = new RegExp(`(<definedName\\s+name="${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>)[\\s\\S]*?(</definedName>)`);
        const replacement = `$1"${xmlEscape(value).replace(/&quot;/g, '""') }"$2`;
        if (pattern.test(definedNames)) definedNames = definedNames.replace(pattern, replacement);
    }

    let generatedWorkbook = await outputZip.file('xl/workbook.xml').async('string');
    generatedWorkbook = generatedWorkbook.replace('</workbook>', `${definedNames}</workbook>`);
    outputZip.file('xl/workbook.xml', generatedWorkbook);
    return outputZip.generateAsync({ type: 'nodebuffer' });
}

async function buildSycebnlExcel(reportData, options = {}) {
    const templatePath = options.templatePath || TEMPLATE_PATH;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    const identity = fillIdentity(workbook, reportData.company, reportData.period);
    fillBilan(workbook, reportData);
    fillResultat(workbook, reportData);
    fillTft(workbook, reportData);
    workbook.calcMode = 'auto';
    const buffer = await workbook.xlsx.writeBuffer();
    return restoreDefinedNames(buffer, templatePath, identity);
}

module.exports = { buildSycebnlExcel, TEMPLATE_PATH };