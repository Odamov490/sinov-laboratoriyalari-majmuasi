// Styled Excel export for the Hisobot section (exceljs, loaded on demand):
// the sheets look like the on-screen tables — blue header, thin grid,
// row colors by result, bold JAMI row, frozen header.

export const HEADER_FILL = 'FFDBE5F1';
const BORDER_COLOR = 'FF94A3B8';

// Row fills matching ROW_COLORS on screen (tailwind tints over white).
export const RESULT_FILLS = {
  MOS: 'FFC9F9D9',
  MOS_EMAS: 'FFFDC0C0',
  QISMAN_MOS_EMAS: 'FFFDC0C0',
  KORIB_CHIQISH: 'FFFDC0C0',
  NAMUNA_TAQDIM_ETILMADI: 'FFFEF196',
  BEKOR_QILINDI: 'FFFEF196',
};

const thin = { style: 'thin', color: { argb: BORDER_COLOR } };
const BORDER = { top: thin, left: thin, bottom: thin, right: thin };

const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });

// Adds one formatted table sheet.
//   columns: [{ header, width, align: 'left'|'center'|'right', money }]
//   rows:    [{ values: [...], fill?: argb }]
//   total:   values for the bold JAMI row (optional)
export function addTableSheet(workbook, name, { columns, rows, total }) {
  const ws = workbook.addWorksheet(name.slice(0, 31), { views: [{ state: 'frozen', ySplit: 1 }] });
  ws.columns = columns.map((c) => ({ width: c.width || 14 }));

  const header = ws.addRow(columns.map((c) => c.header));
  header.height = 45;
  header.eachCell((cell) => {
    cell.font = { bold: true, size: 10 };
    cell.fill = fill(HEADER_FILL);
    cell.border = BORDER;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });

  const styleRow = (row, rowFill, bold) => {
    columns.forEach((c, i) => {
      const cell = row.getCell(i + 1);
      cell.border = BORDER;
      cell.font = { size: 10, bold: Boolean(bold) };
      cell.alignment = { horizontal: c.align || 'left', vertical: 'middle', wrapText: true };
      if (c.money) cell.numFmt = '#,##0';
      if (rowFill) cell.fill = fill(rowFill);
    });
  };

  rows.forEach((r) => styleRow(ws.addRow(r.values), r.fill));
  if (total) styleRow(ws.addRow(total), HEADER_FILL, true);
  return ws;
}

export async function newWorkbook() {
  const { default: ExcelJS } = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  wb.creator = 'SLM — Sinov laboratoriyalari majmuasi';
  wb.created = new Date();
  return wb;
}

export async function downloadWorkbook(workbook, fileName) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
