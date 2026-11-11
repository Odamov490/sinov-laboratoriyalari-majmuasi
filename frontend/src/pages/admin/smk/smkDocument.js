import { useEffect, useState } from 'react';
import { tr, locName } from '../../../i18n/tr.js';
import { getSettings } from '../../../services/publicApi';

// SMK formasi = hujjat: shapka (logo + tashkilot qatorlari + forma nomi +
// rekvizitlar) va jadval (ustunlar = forma maydonlari, qatorlar = yozuvlar).
// Bitta HTML ham ekranda (oldindan ko'rish), ham Word (.doc) va PDF'da ishlatiladi.

export const LOGO_URL = '/logo.png'; // standart logo (sozlamada boshqasi tanlanmagan bo'lsa)
export const FORM_LOGO_KEY = 'form_logo_url';

// Logo o'z proporsiyasini saqlaydi: balandligi LOGO_H, juda keng logo esa
// LOGO_MAX_W ga sig'diriladi (to'rtburchak logolar siqilmaydi).
const LOGO_H = 60;
const LOGO_MAX_W = 180;
export function fitLogo(naturalW, naturalH) {
  if (!naturalW || !naturalH) return { width: LOGO_H, height: LOGO_H };
  let width = Math.round((LOGO_H * naturalW) / naturalH);
  let height = LOGO_H;
  if (width > LOGO_MAX_W) {
    width = LOGO_MAX_W;
    height = Math.max(1, Math.round((LOGO_MAX_W * naturalH) / naturalW));
  }
  return { width, height };
}
export const DEFAULT_LOGO = { src: LOGO_URL, width: LOGO_H, height: LOGO_H };

const naturalSize = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(fitLogo(img.naturalWidth, img.naturalHeight));
    img.onerror = () => resolve(fitLogo(0, 0));
    img.src = src;
  });

// Forma logosi: Sozlamalar -> "Forma logosi" (SiteSetting form_logo_url), bo'lmasa
// standart. Natija: { src, width, height } (shapkadagi o'lcham).
let logoPromise = null;
export function getFormLogo() {
  if (!logoPromise) {
    logoPromise = getSettings()
      .then((s) => (/^\/uploads\/[\w.-]+\.(png|jpe?g)$/i.test(s?.[FORM_LOGO_KEY] || '') ? s[FORM_LOGO_KEY] : LOGO_URL))
      .catch(() => {
        logoPromise = null;
        return LOGO_URL;
      })
      .then(async (src) => ({ src, ...(await naturalSize(src)) }));
  }
  return logoPromise;
}
// Sozlamada logo almashtirilganda keshni tozalash.
export const resetFormLogoCache = () => {
  logoPromise = null;
};
export function useFormLogo() {
  const [logo, setLogo] = useState(DEFAULT_LOGO);
  useEffect(() => {
    let alive = true;
    getFormLogo().then((l) => alive && setLogo(l));
    return () => {
      alive = false;
    };
  }, []);
  return logo;
}
export const BLANK_ROWS = 10; // yozuv yo'q bo'lsa — bo'sh blank uchun

// Yangi formaning dastlabki shapkasi (SMK hujjatlari namunasi bo'yicha). Har bir
// formada keyin o'zgartirish mumkin; "Документ №" qiymati — forma kodi.
export const DEFAULT_HEADER = () => ({
  orgLines: ['Комплекс испытательных лабораторий'],
  meta: [
    { label: 'Документ №', value: '{kod}' },
    { label: 'Дата введения', value: '' },
    { label: 'Ревизия', value: '' },
    { label: 'Дата ревизии', value: '' },
  ],
  orientation: 'portrait',
});

export const normalizeHeader = (h) => {
  const d = DEFAULT_HEADER();
  if (!h || typeof h !== 'object') return d;
  return {
    orgLines: Array.isArray(h.orgLines) ? h.orgLines : d.orgLines,
    meta: Array.isArray(h.meta) ? h.meta : d.meta,
    blocks: Array.isArray(h.blocks) ? h.blocks : [],
    orientation: h.orientation === 'portrait' ? 'portrait' : 'landscape',
  };
};

// Matn bloklari namunalari (formaga tez qo'shish uchun). Bo'sh joylar — "____".
export const BLOCK_PRESETS = () => [
  {
    key: 'approve',
    label: tr('«Tasdiqlayman» bloki'),
    block: {
      text: '«УТВЕРЖДАЮ»\nДиректор\nГУ «Узбекский институт стандартов»\n_______________ Ф.И.О.\n«___» __________ 20___ г.',
      align: 'right',
      bold: true,
      size: 'normal',
      indent: false,
      position: 'before',
    },
  },
  { key: 'title', label: tr('Sarlavha'), block: { text: 'Акт', align: 'center', bold: true, size: 'large', indent: false, position: 'before' } },
  {
    key: 'paragraph',
    label: tr('Matn (xatboshi)'),
    block: { text: '', align: 'justify', bold: false, size: 'normal', indent: true, position: 'before' },
  },
  {
    key: 'signatures',
    label: tr('Imzolar'),
    block: {
      text: 'Председатель комиссии: _______________ Ф.И.О.\nЧлены комиссии: _______________ Ф.И.О.\n_______________ Ф.И.О.',
      align: 'left',
      bold: false,
      size: 'normal',
      indent: false,
      position: 'after',
    },
  },
];

const fmtDate = (v) => (v ? String(v).slice(0, 10).split('-').reverse().join('.') : '');
const today = () => new Date().toISOString().slice(0, 10).split('-').reverse().join('.');

// {laboratoriya}, {kod}, {sana} o'rniga qiymat.
export function resolveTokens(text, { form, lab }) {
  return String(text ?? '')
    .replace(/\{laboratoriya\}/gi, lab ? locName(lab) : '')
    .replace(/\{kod\}/gi, form?.code || '')
    .replace(/\{sana\}/gi, today());
}

export function displayValue(field, value) {
  if (field.type === 'checkbox') return value === undefined || value === null ? '' : value ? tr('Ha') : tr("Yo'q");
  if (value === null || value === undefined || value === '') return '';
  if (field.type === 'date') return fmtDate(value);
  return String(value);
}

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Har bir chiziq bir marta chiziladi: katak — o'ng va pastki, jadval — yuqori va
// chap chegara (border-collapse'da qo'shni kataklar chizig'i ustma-ust tushib,
// PDF'da qalin/qo'sh chiziq bo'lib qolardi).
const B = 'border-right:1px solid #000;border-bottom:1px solid #000;';
const TB = 'border-top:1px solid #000;border-left:1px solid #000;border-collapse:separate;border-spacing:0;';
const FONT = "font-family:'Times New Roman',Times,serif;";
const LH = 'line-height:1.35;';
// Ustun enlari (px) — HTML va Word (docx) bir xil hisoblaydi.
export const COL = { metaLabel: 120, metaValue: 130, num: 38 };

// Shapka ma'lumoti (HTML va Word uchun umumiy): tokenlar almashtirilgan.
export function headerModel({ form, lab }) {
  const header = normalizeHeader(form.header);
  const ctx = { form, lab };
  return {
    orientation: header.orientation,
    orgLines: header.orgLines.map((l) => resolveTokens(l, ctx).trim()).filter(Boolean),
    title: form.title,
    meta: header.meta
      .filter((m) => String(m.label || '').trim())
      .map((m) => ({ label: resolveTokens(m.label, ctx), value: resolveTokens(m.value, ctx) })),
    blocks: header.blocks
      .filter((b) => String(b?.text || '').trim())
      .map((b) => ({
        text: resolveTokens(b.text, ctx),
        align: ['left', 'center', 'right', 'justify'].includes(b.align) ? b.align : 'left',
        bold: Boolean(b.bold),
        size: b.size === 'large' ? 'large' : 'normal',
        indent: Boolean(b.indent),
        position: b.position === 'after' ? 'after' : 'before',
      })),
  };
}

// Matn bloki HTML'i. "right" blok — o'ng tomonda alohida ustun kabi (matn
// qatorlari o'ngga tekislanadi), "justify" — ikki tomonga, xatboshi bilan.
function blockHtml(b) {
  const style =
    `margin:10px 0;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.35;` +
    `font-family:'Times New Roman',Times,serif;text-align:${b.align};` +
    `font-size:${b.size === 'large' ? '13pt' : '11pt'};font-weight:${b.bold ? 'bold' : 'normal'};` +
    (b.indent ? 'text-indent:1.25cm;' : '');
  return `<div data-block="1" style="${style}">${esc(b.text)}</div>`;
}

// Shapka + jadval. Shapka — BITTA jadval (ichma-ich jadval yo'q, shuning uchun
// qo'sh chiziq chiqmaydi): logo va markaz kataklari rekvizit qatorlari bo'ylab
// birlashtiriladi. Ikkala jadval ham table-layout:fixed — uzun matn katakni
// kengaytirmaydi, qatorga o'raladi.
// Bir xil qiymatli kataklarni birlashtirish (№ ustunidan tashqari, bo'sh kataklar
// birlashtirilmaydi). Avval gorizontal (qator ichida yonma-yon), keyin vertikal
// (ustun bo'ylab, faqat gorizontal birlashmagan kataklar) — natija doim to'g'ri
// to'rtburchaklar. Qaytaradi: span[i][c] = { rs, cs } | null (gorizontal ichida)
// | { v: true } (yuqoridagi katak ichida); breakAfter[i] — shu qatordan keyin
// sahifa bo'linishi mumkinmi (vertikal birlashma kesilmasin).
export function mergeCells(texts, present, { vertical = false, horizontal = false } = {}) {
  const R = texts.length;
  const C = R ? texts[0].length : 0;
  const span = texts.map((row) => row.map(() => ({ rs: 1, cs: 1 })));
  if (horizontal) {
    for (let i = 0; i < R; i += 1) {
      if (!present[i]) continue;
      for (let c = 0; c < C; ) {
        if (texts[i][c] === '') {
          c += 1;
          continue;
        }
        let j = c + 1;
        while (j < C && texts[i][j] === texts[i][c]) j += 1;
        if (j - c > 1) {
          span[i][c].cs = j - c;
          for (let k = c + 1; k < j; k += 1) span[i][k] = null;
        }
        c = j;
      }
    }
  }
  if (vertical) {
    for (let c = 0; c < C; c += 1) {
      for (let i = 0; i < R; ) {
        const cell = span[i][c];
        if (!present[i] || !cell || cell.cs !== 1 || texts[i][c] === '') {
          i += 1;
          continue;
        }
        let j = i + 1;
        while (j < R && present[j] && span[j][c] && span[j][c].cs === 1 && texts[j][c] === texts[i][c]) j += 1;
        if (j - i > 1) {
          cell.rs = j - i;
          for (let k = i + 1; k < j; k += 1) span[k][c] = { v: true };
        }
        i = j;
      }
    }
  }
  const breakAfter = texts.map((_, i) => i === R - 1 || span[i + 1].every((s) => !s || !s.v));
  return { span, breakAfter };
}

export function buildDocumentHtml({ form, lab, rows, logo = DEFAULT_LOGO, blankRows = BLANK_ROWS, merge }) {
  const h = headerModel({ form, lab });
  const fields = form.fields || [];
  const n = Math.max(1, h.meta.length);
  const logoW = logo.width + 14;
  const org = h.orgLines.map((l) => `<p style="margin:0;font-weight:bold;font-size:10.5pt;${LH}">${esc(l)}</p>`).join('');
  const metaCell = (t, extra = '') =>
    `<td style="${B}padding:3px 6px;font-size:9.5pt;${LH}vertical-align:middle;overflow-wrap:anywhere;${extra}">${esc(t)}&nbsp;</td>`;
  const metaRow = (m) => (m ? metaCell(m.label) + metaCell(m.value) : '');
  const firstRow =
    `<td rowspan="${n}" style="${B}padding:6px;text-align:center;vertical-align:middle">` +
    `<img src="${esc(logo.src)}" width="${logo.width}" height="${logo.height}" alt="" style="display:inline-block;width:${logo.width}px;height:${logo.height}px;max-width:none"></td>` +
    `<td rowspan="${n}" style="${B}padding:6px 10px;text-align:center;vertical-align:middle;overflow-wrap:anywhere">${org}` +
    `<p style="margin:${org ? '6px' : '0'} 0 0;font-weight:bold;font-size:13pt;${LH}">${esc(h.title)}</p></td>` +
    metaRow(h.meta[0]);
  const restRows = h.meta.slice(1).map((m) => `<tr>${metaRow(m)}</tr>`).join('');
  const cols =
    `<col style="width:${logoW}px"><col>` + (h.meta.length ? `<col style="width:${COL.metaLabel}px"><col style="width:${COL.metaValue}px">` : '');
  const headerHtml =
    `<table data-part="header" style="width:100%;${TB}table-layout:fixed;${FONT}margin-bottom:10px">` +
    `<colgroup>${cols}</colgroup><tbody><tr>${firstRow}</tr>${restRows}</tbody></table>`;

  const th = (t) =>
    `<th style="${B}padding:5px 6px;background:#f0f0f0;font-size:10pt;font-weight:bold;text-align:center;vertical-align:middle;${LH}overflow-wrap:anywhere">${esc(t)}</th>`;
  const head = `<thead style="display:table-header-group"><tr>${th('№')}${fields.map((f) => th(f.label)).join('')}</tr></thead>`;
  const list = rows.length ? rows : Array.from({ length: blankRows }, () => null);
  const td = (content, extra = '') =>
    `<td style="${B}padding:4px 6px;font-size:10pt;${LH}vertical-align:top;white-space:pre-wrap;overflow-wrap:anywhere;${extra}">${content}</td>`;
  const texts = list.map((r) => fields.map((f) => (r ? displayValue(f, r.data?.[f.key]) : '')));
  const { span, breakAfter } = mergeCells(texts, list.map(Boolean), merge);
  // data-row="1" — shu qatordan keyin sahifa bo'linishi mumkin (birlashma kesilmaydi).
  const body = list
    .map(
      (r, i) =>
        `<tr data-row="${breakAfter[i] ? 1 : 0}">${td(r ? String(i + 1) : '&nbsp;', 'text-align:center')}${fields
          .map((f, c) => {
            const s = span[i][c];
            if (!s || s.v) return '';
            const attr = (s.cs > 1 ? ` colspan="${s.cs}"` : '') + (s.rs > 1 ? ` rowspan="${s.rs}"` : '');
            const extra = s.cs > 1 || s.rs > 1 ? 'vertical-align:middle;text-align:center' : '';
            return td(`${esc(texts[i][c])}&nbsp;`, extra).replace('<td', `<td${attr}`);
          })
          .join('')}</tr>`
    )
    .join('');
  const tableHtml =
    `<table data-part="table" style="width:100%;${TB}table-layout:fixed;${FONT}">` +
    `<colgroup><col style="width:${COL.num}px">${fields.map(() => '<col>').join('')}</colgroup>${head}<tbody>${body}</tbody></table>`;
  const beforeHtml = h.blocks.filter((b) => b.position === 'before').map(blockHtml).join('');
  const afterHtml = h.blocks.filter((b) => b.position === 'after').map(blockHtml).join('');
  const afterWrap = afterHtml ? `<div style="margin-top:12px">${afterHtml}</div>` : '';
  return {
    headerHtml,
    beforeHtml,
    afterHtml,
    tableHtml,
    html: headerHtml + beforeHtml + tableHtml + afterWrap,
    orientation: h.orientation,
  };
}

const fileBase = (form, lab) =>
  `${form.code}-${lab ? lab.slug : 'forma'}-${new Date().toISOString().slice(0, 10)}`.replace(/[^\w.-]+/g, '_');

function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Word: haqiqiy .docx (smkDocx.js) — jadval enlari, chegaralar, logo va sahifa
// yo'nalishi Word'ning o'z formatida, shuning uchun hech narsa siljimaydi.
export async function exportWord({ form, lab, rows, merge }) {
  const logo = await getFormLogo();
  const res = await fetch(logo.src);
  const bytes = new Uint8Array(await res.arrayBuffer());
  const isJpeg = /jpe?g/i.test(res.headers.get('content-type') || '') || /\.jpe?g$/i.test(logo.src);
  const { buildDocx } = await import('./smkDocx.js');
  const list = rows.length ? rows : Array.from({ length: BLANK_ROWS }, () => null);
  const texts = list.map((r) => (form.fields || []).map((f) => (r ? displayValue(f, r.data?.[f.key]) : '')));
  const blob = buildDocx({
    header: headerModel({ form, lab }),
    fields: form.fields || [],
    rows: list.map((r, i) => (r ? texts[i] : null)),
    spans: mergeCells(texts, list.map(Boolean), merge).span,
    logo: { bytes, ext: isJpeg ? 'jpeg' : 'png', width: logo.width, height: logo.height },
  });
  saveBlob(blob, `${fileBase(form, lab)}.docx`);
}

// PDF: hujjat ekrandan tashqarida chiziladi (html2canvas), sahifalarga qator
// chegarasidan bo'linadi (qator ikki sahifaga yorilmaydi), jadval sarlavhasi
// har bir keyingi sahifada takrorlanadi.
export async function exportPdf({ form, lab, rows, merge }) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
  const { html, orientation } = buildDocumentHtml({ form, lab, rows, merge, logo: await getFormLogo() });
  const land = orientation === 'landscape';
  const widthPx = land ? 1100 : 760;
  const box = document.createElement('div');
  box.style.cssText = `position:fixed;left:-10000px;top:0;width:${widthPx}px;background:#fff;color:#000;padding:0`;
  box.innerHTML = html;
  document.body.appendChild(box);
  try {
    await Promise.all(
      [...box.querySelectorAll('img')].map((img) => (img.complete ? null : new Promise((r) => { img.onload = r; img.onerror = r; })))
    );
    // Brauzer canvas balandligi chegarali (~32k px): uzun jurnalda masshtab kichrayadi.
    const scale = Math.max(0.5, Math.min(2, 30000 / Math.max(1, box.scrollHeight)));
    // Tailwind preflight `img{display:block}` html2canvas'ning shrift o'lchovini
    // (u yashirin <img> bilan baseline'ni o'lchaydi) buzadi — matn kataklarda
    // pastga surilib chiqadi. Chizish vaqtida ilova (#root) dan tashqaridagi
    // elementlar uchun (o'lchov elementi va shu quti) inline-block qaytariladi.
    const fix = document.createElement('style');
    fix.textContent = 'body > div:not(#root) img{display:inline-block !important}';
    document.head.appendChild(fix);
    let canvas;
    try {
      canvas = await html2canvas(box, { scale, backgroundColor: '#ffffff' });
    } finally {
      fix.remove();
    }
    const top0 = box.getBoundingClientRect().top;
    const px = (y) => Math.round((y - top0) * scale);
    const thead = box.querySelector('[data-part="table"] thead').getBoundingClientRect();
    const theadTop = px(thead.top);
    const theadH = px(thead.bottom) - theadTop;
    // Bo'linish mumkin bo'lgan nuqtalar: shapka va thead oxiri, har bir qator oxiri.
    // Matn bloklari (jadvaldan keyingilari ham) ham yorilmaydi.
    const breaks = [
      px(thead.bottom),
      ...[...box.querySelectorAll('tr[data-row="1"], [data-block]')].map((el) => px(el.getBoundingClientRect().bottom)),
    ].sort((a, b) => a - b);

    const pdf = new jsPDF(land ? 'l' : 'p', 'mm', 'a4');
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const imgW = pageW - margin * 2;
    const pxPerMm = canvas.width / imgW;
    const pagePx = Math.floor((pageH - margin * 2) * pxPerMm);

    const slice = (y, h) => {
      const c = document.createElement('canvas');
      c.width = canvas.width;
      c.height = h;
      c.getContext('2d').drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
      return c.toDataURL('image/jpeg', 0.92);
    };
    const theadImg = theadH > 0 ? slice(theadTop, theadH) : null;

    let start = 0;
    let first = true;
    while (start < canvas.height - 1) {
      const room = first ? pagePx : pagePx - theadH;
      let end = Math.min(canvas.height, start + room);
      if (end < canvas.height) {
        const fit = breaks.filter((b) => b > start && b <= end);
        if (fit.length) end = fit[fit.length - 1];
      }
      if (!first) pdf.addPage();
      let y = margin;
      if (!first && theadImg) {
        pdf.addImage(theadImg, 'JPEG', margin, y, imgW, theadH / pxPerMm);
        y += theadH / pxPerMm;
      }
      pdf.addImage(slice(start, end - start), 'JPEG', margin, y, imgW, (end - start) / pxPerMm);
      start = end;
      first = false;
    }
    pdf.save(`${fileBase(form, lab)}.pdf`);
  } finally {
    box.remove();
  }
}

// Chop etish: hujjat yangi oynada (brauzer orqali). Oyna tugma bosilgan
// zahoti ochilib beriladi (`w`) — aks holda ma'lumot yuklangach ochilgan
// oynani brauzer popup sifatida bloklashi mumkin.
export async function printDocument({ form, lab, rows, merge }, w) {
  if (!w) return;
  const logo = await getFormLogo();
  const { html, orientation } = buildDocumentHtml({ form, lab, rows, merge, logo: { ...logo, src: new URL(logo.src, window.location.origin).href } });
  w.document.write(
    `<!doctype html><html><head><meta charset="utf-8"><title>${esc(form.title)}</title>` +
      `<style>@page{size:A4 ${orientation};margin:10mm} body{margin:0;color:#000} thead{display:table-header-group} tr{page-break-inside:avoid}</style>` +
      `</head><body>${html}</body></html>`
  );
  w.document.close();
  const go = () => {
    w.focus();
    w.print();
  };
  const img = w.document.querySelector('img');
  if (img && !img.complete) img.onload = img.onerror = go;
  else go();
}
