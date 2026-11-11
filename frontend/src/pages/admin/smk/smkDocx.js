// SMK formasini haqiqiy Word (.docx) faylga yozish — tashqi paketsiz.
// .docx = ZIP (siqilmagan, "store") ichida WordprocessingML XML fayllari.
// Shapka va jadval Word'ning o'z jadvallari: ustun enlari qat'iy (fixed layout),
// chegaralar bitta chiziq, jadval sarlavhasi har sahifada takrorlanadi, qator
// sahifalarga bo'linmaydi, logo proporsiyasi saqlanadi.
import { COL } from './smkDocument.js';

const PX = 15; // 1 px = 15 twip (96 dpi)
const EMU = 9525; // 1 px = 9525 EMU
const PAGE = {
  landscape: { w: 16838, h: 11906 },
  portrait: { w: 11906, h: 16838 },
};
const MARGIN = 720; // 1,27 sm

const xml = (s) =>
  String(s ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const FONT = '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman"/>';

// Matn bo'lagi: yangi qatorlar <w:br/> bo'ladi.
function run(text, { bold = false, size = 20 } = {}) {
  const rPr = `<w:rPr>${FONT}${bold ? '<w:b/><w:bCs/>' : ''}<w:sz w:val="${size}"/><w:szCs w:val="${size}"/></w:rPr>`;
  const parts = String(text ?? '').split('\n');
  return parts
    .map((p, i) => `<w:r>${rPr}${i ? '<w:br/>' : ''}<w:t xml:space="preserve">${xml(p)}</w:t></w:r>`)
    .join('');
}

function para(content, { align = 'left', after = 0, before = 0, firstLine = 0 } = {}) {
  const ind = firstLine ? `<w:ind w:firstLine="${firstLine}"/>` : '';
  return `<w:p><w:pPr><w:spacing w:before="${before}" w:after="${after}" w:line="240" w:lineRule="auto"/>${ind}<w:jc w:val="${align}"/></w:pPr>${content}</w:p>`;
}

// Matn bloki -> paragraflar (har bir qator alohida paragraf: xatboshi faqat
// paragraf boshida, "right"/"center" tekislash har qatorga).
const JC = { left: 'left', center: 'center', right: 'right', justify: 'both' };
function blockXml(b) {
  const lines = String(b.text).split('\n');
  return lines
    .map((line, i) =>
      para(run(line, { bold: b.bold, size: b.size === 'large' ? 26 : 22 }), {
        align: JC[b.align] || 'left',
        before: i === 0 ? 120 : 0,
        after: i === lines.length - 1 ? 120 : 0,
        firstLine: b.indent ? 709 : 0,
      })
    )
    .join('');
}

function cell(width, content, { vMerge, shade, vAlign = 'center', gridSpan = 1 } = {}) {
  const merge = vMerge ? `<w:vMerge${vMerge === 'restart' ? ' w:val="restart"' : ''}/>` : '';
  const shd = shade ? `<w:shd w:val="clear" w:color="auto" w:fill="${shade}"/>` : '';
  const gs = gridSpan > 1 ? `<w:gridSpan w:val="${gridSpan}"/>` : '';
  // tcPr tartibi: tcW, gridSpan, vMerge, shd, vAlign. Bo'sh katakda ham paragraf shart.
  return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${gs}${merge}${shd}<w:vAlign w:val="${vAlign}"/></w:tcPr>${content || para('')}</w:tc>`;
}

function table(gridWidths, rowsXml) {
  const total = gridWidths.reduce((a, b) => a + b, 0);
  const border = (side) => `<w:${side} w:val="single" w:sz="6" w:space="0" w:color="000000"/>`;
  return (
    // CT_TblPr elementlari tartibi qat'iy: tblW, jc, tblBorders, tblLayout, tblCellMar.
    `<w:tbl><w:tblPr><w:tblW w:w="${total}" w:type="dxa"/><w:jc w:val="center"/>` +
    `<w:tblBorders>${['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(border).join('')}</w:tblBorders>` +
    `<w:tblLayout w:type="fixed"/>` +
    `<w:tblCellMar><w:top w:w="40" w:type="dxa"/><w:left w:w="90" w:type="dxa"/><w:bottom w:w="40" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tblCellMar>` +
    `</w:tblPr><w:tblGrid>${gridWidths.map((w) => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>${rowsXml}</w:tbl>`
  );
}

function logoRun(logo) {
  const cx = Math.round(logo.width * EMU);
  const cy = Math.round(logo.height * EMU);
  return (
    `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/>` +
    `<wp:docPr id="1" name="Logo"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>` +
    `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="1" name="logo"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="rIdLogo"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>` +
    `</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`
  );
}

// Ustun enlarini twip'da butun songa taqsimlash (yig'indisi aynan `total`).
function split(total, n) {
  const base = Math.floor(total / n);
  return Array.from({ length: n }, (_, i) => base + (i < total - base * n ? 1 : 0));
}

export function buildDocumentXml({ header, model, logo }) {
  const { fields } = model;
  const page = PAGE[header.orientation] || PAGE.landscape;
  const content = page.w - MARGIN * 2;

  // --- Shapka: logo | markaz | rekvizit nomi | qiymati (logo va markaz birlashtirilgan).
  const hasMeta = header.meta.length > 0;
  const logoW = (logo.width + 14) * PX;
  const metaW = hasMeta ? [COL.metaLabel * PX, COL.metaValue * PX] : [];
  const centerW = content - logoW - metaW.reduce((a, b) => a + b, 0);
  const grid = [logoW, centerW, ...metaW];
  const center =
    header.orgLines.map((l) => para(run(l, { bold: true, size: 21 }), { align: 'center' })).join('') +
    para(run(header.title, { bold: true, size: 26 }), { align: 'center', before: header.orgLines.length ? 100 : 0 });
  const metaCells = (m) =>
    m ? cell(metaW[0], para(run(m.label, { size: 19 }))) + cell(metaW[1], para(run(m.value, { size: 19 }))) : '';
  const n = Math.max(1, header.meta.length);
  let headRows = '';
  for (let i = 0; i < n; i += 1) {
    const first = i === 0;
    const merge = n > 1 ? (first ? 'restart' : 'continue') : undefined;
    headRows +=
      `<w:tr><w:trPr><w:cantSplit/></w:trPr>` +
      cell(logoW, first ? para(logoRun(logo), { align: 'center' }) : '', { vMerge: merge }) +
      cell(centerW, first ? center : '', { vMerge: merge }) +
      metaCells(header.meta[i]) +
      `</w:tr>`;
  }
  const headerTable = table(grid, headRows);

  // --- Jadval: № + ustunlar (teng taqsimlangan).
  const numW = COL.num * PX;
  const fieldW = split(content - numW, Math.max(1, fields.length));
  const colW = [numW, ...fieldW];
  const widthOf = (from, n) => colW.slice(from, from + n).reduce((a, b) => a + b, 0);
  const thPara = (t) => para(run(t, { bold: true }), { align: 'center' });
  const HEAD = { shade: 'F0F0F0' };
  // Sarlavha: 1 yoki 2 qavat (guruh — gridSpan, guruhsiz ustun — ikki qavat bo'ylab vMerge).
  let col = 0;
  let row1 = '';
  let row2 = '';
  let subIdx = 0;
  for (const c of model.top) {
    const w = widthOf(col, c.colspan);
    if (model.twoLevel && !c.group) {
      row1 += cell(w, thPara(c.label), { ...HEAD, vMerge: 'restart' });
      row2 += cell(w, '', { ...HEAD, vMerge: 'continue' });
    } else {
      row1 += cell(w, thPara(c.label), { ...HEAD, gridSpan: c.colspan });
      if (c.group) {
        for (let k = 0; k < c.colspan; k += 1) row2 += cell(colW[col + k], thPara(model.sub[subIdx++].label), HEAD);
      }
    }
    col += c.colspan;
  }
  const hdrTr = (cells) => `<w:tr><w:trPr><w:cantSplit/><w:tblHeader/></w:trPr>${cells}</w:tr>`;
  const headRowsXml = hdrTr(row1) + (model.twoLevel ? hdrTr(row2) : '');

  const bodyRows = model.list
    .map((r, i) => {
      const cells = fields
        .map((f, c) => {
          const sp = model.spans[i][c];
          const text = model.texts[i][c];
          if (sp === 0) return cell(fieldW[c], '', { vMerge: 'continue', vAlign: 'center' });
          if (sp > 1) return cell(fieldW[c], para(run(text)), { vMerge: 'restart', vAlign: 'center' });
          return cell(fieldW[c], para(run(text)), { vAlign: 'top' });
        })
        .join('');
      return `<w:tr><w:trPr><w:cantSplit/></w:trPr>${cell(numW, para(run(r ? String(i + 1) : ''), { align: 'center' }), { vAlign: 'top' })}${cells}</w:tr>`;
    })
    .join('');
  // "Итого" qatorlari: birinchi `span` ustun birlashtirilgan.
  const footRows = model.footer
    .map(
      (fr) =>
        `<w:tr><w:trPr><w:cantSplit/></w:trPr>` +
        cell(widthOf(0, fr.span), para(run(fr.label, { bold: true })), { gridSpan: fr.span }) +
        fr.cells.map((c, k) => cell(colW[fr.span + k], para(run(c.text, { bold: true })))).join('') +
        `</w:tr>`
    )
    .join('');
  const dataTable = table(colW, headRowsXml + bodyRows + footRows);

  const blocks = header.blocks || [];
  const before = blocks.filter((b) => b.position === 'before').map(blockXml).join('');
  const after = blocks.filter((b) => b.position === 'after').map(blockXml).join('');

  const sect =
    `<w:sectPr><w:pgSz w:w="${page.w}" w:h="${page.h}"${header.orientation === 'landscape' ? ' w:orient="landscape"' : ''}/>` +
    `<w:pgMar w:top="${MARGIN}" w:right="${MARGIN}" w:bottom="${MARGIN}" w:left="${MARGIN}" w:header="360" w:footer="360" w:gutter="0"/></w:sectPr>`;

  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ` +
    `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ` +
    `xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">` +
    // Jadvallar orasida kichik bo'sh paragraf (aks holda Word ularni bitta jadvalga qo'shib yuboradi).
    `<w:body>${headerTable}${para(run('', { size: 12 }))}${before}${dataTable}${para(run('', { size: 4 }))}${after}${sect}</w:body></w:document>`
  );
}

// --- Minimal ZIP (store) yozuvchi ---
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function zipStore(files) {
  const enc = new TextEncoder();
  const parts = [];
  const central = [];
  let offset = 0;
  const d = new Date();
  const dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2);
  const dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  for (const f of files) {
    const name = enc.encode(f.name);
    const data = typeof f.data === 'string' ? enc.encode(f.data) : f.data;
    const crc = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true);
    local.setUint16(8, 0, true);
    local.setUint16(10, dosTime, true);
    local.setUint16(12, dosDate, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, name.length, true);
    local.setUint16(28, 0, true);
    parts.push(new Uint8Array(local.buffer), name, data);
    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true);
    cd.setUint16(4, 20, true);
    cd.setUint16(6, 20, true);
    cd.setUint16(8, 0x0800, true);
    cd.setUint16(10, 0, true);
    cd.setUint16(12, dosTime, true);
    cd.setUint16(14, dosDate, true);
    cd.setUint32(16, crc, true);
    cd.setUint32(20, data.length, true);
    cd.setUint32(24, data.length, true);
    cd.setUint16(28, name.length, true);
    cd.setUint32(42, offset, true);
    central.push(new Uint8Array(cd.buffer), name);
    offset += 30 + name.length + data.length;
  }
  const cdSize = central.reduce((a, b) => a + b.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, cdSize, true);
  end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, new Uint8Array(end.buffer)], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

export function buildDocx({ header, model, logo }) {
  const ext = logo.ext === 'jpeg' ? 'jpeg' : 'png';
  return zipStore([
    {
      name: '[Content_Types].xml',
      data:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Default Extension="png" ContentType="image/png"/>' +
        '<Default Extension="jpeg" ContentType="image/jpeg"/>' +
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
        '</Types>',
    },
    {
      name: '_rels/.rels',
      data:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
        '</Relationships>',
    },
    {
      name: 'word/_rels/document.xml.rels',
      data:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        `<Relationship Id="rIdLogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo.${ext}"/>` +
        '</Relationships>',
    },
    { name: 'word/document.xml', data: buildDocumentXml({ header, model, logo }) },
    { name: `word/media/logo.${ext}`, data: logo.bytes },
  ]);
}
