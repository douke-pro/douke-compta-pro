'use strict';

const path = require('path');
const ExcelJS = require('exceljs');

const TEMPLATE_PATH = path.join(__dirname, '..', 'backups', 'EF_SYSCEBNL_Juin (1).xlsx');
const CORRECTION_NOTE = 'Correction du gabarit SYCEBNL - audit des formules, 2026-09-21.';

function formulaOf(cell) {
    if (!cell || !cell.value || typeof cell.value !== 'object') return cell?.value;
    return cell.value.formula || cell.value.sharedFormula;
}

function setFormula(worksheet, address, formula, detail) {
    const cell = worksheet.getCell(address);
    if (formulaOf(cell) !== formula) cell.value = { formula };
    cell.note = `${CORRECTION_NOTE}\n${detail}`;
}

async function main() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(TEMPLATE_PATH);

    setFormula(workbook.getWorksheet('BILAN'), 'L16', 'SUM(L6:L15)',
        'Le total passif N-1 inclut désormais la ligne 15, comme K16.');
    setFormula(workbook.getWorksheet('NOTE 5D'), 'G14', 'B14+C14-D14-E14-F14',
        'Suppression de la référence parasite à D1.');
    setFormula(workbook.getWorksheet('NOTE 24'), 'D9', 'B9-C9',
        'La variation de la ligne 9 utilise la valeur N-1 de la même ligne.');
    setFormula(workbook.getWorksheet('NOTE 24'), 'E9', 'IF(C9=0,0,(B9-C9)/C9)*100',
        'Le pourcentage de variation de la ligne 9 utilise la valeur N-1 de la même ligne.');
    setFormula(workbook.getWorksheet('NOTE 1'), 'C19', 'SUM(C14:C18)',
        'Restauration du sous-total des dettes de location-acquisition.');

    const note33 = workbook.getWorksheet('NOTE 33');
    for (let row = 9; row <= 15; row += 1) {
        setFormula(note33, `E${row}`, `IF(C${row}=0,0,(B${row}-C${row})/C${row})*100`,
            `Correction du décalage de trois lignes dans la variation de la ligne ${row}.`);
    }

    workbook.calcMode = 'auto';
    await workbook.xlsx.writeFile(TEMPLATE_PATH);
    console.log(`Gabarit SYCEBNL corrigé : ${TEMPLATE_PATH}`);
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});