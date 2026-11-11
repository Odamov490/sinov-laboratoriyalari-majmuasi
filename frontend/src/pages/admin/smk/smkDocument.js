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

export const DEFAULT_HEADER = () => ({
  orgLines: ['SINOV LABORATORIYALARI MAJMUASI', '{laboratoriya}'],
  meta: [
    { label: tr('Shakl kodi'), value: '{kod}' },
    { label: tr('Versiya'), value: '01' },
    { label: tr('Sana'), value: '' },
  ],
  orientation: 'landscape',
});

export const normalizeHeader = (h) => {
  const d = DEFAULT_HEADER();
  if (!h || typeof h !== 'object') return d;
  return {
    orgLines: Array.isArray(h.orgLines) ? h.orgLines : d.orgLines,
    meta: Array.isArray(h.meta) ? h.meta : d.meta,
    orientation: h.orientation === 'portrait' ? 'portrait' : 'landscape',
  };
};

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

const B = 'border:1px solid #000;';
const FONT = "font-family:'Times New Roman',Times,serif;";

// Shapka + jadval (inline uslublar — Word ham, html2canvas ham bir xil ko'radi).
export function buildDocumentHtml({ form, lab, rows, logo = DEFAULT_LOGO, blankRows = BLANK_ROWS }) {
  const header = normalizeHeader(form.header);
  const ctx = { form, lab };
  const fields = form.fields || [];
  const org = header.orgLines
    .filter((l) => String(l).trim())
    .map((l) => `<p style="margin:0;font-weight:bold;font-size:10.5pt">${esc(resolveTokens(l, ctx))}</p>`)
    .join('');
  const metaRows = header.meta
    .filter((m) => String(m.label || '').trim())
    .map(
      (m) =>
        `<tr><td style="${B}padding:3px 6px;font-size:9.5pt;white-space:nowrap">${esc(resolveTokens(m.label, ctx))}</td>` +
        `<td style="${B}padding:3px 6px;font-size:9.5pt">${esc(resolveTokens(m.value, ctx))}&nbsp;</td></tr>`
    )
    .join('');

  const headerHtml =
    `<table data-part="header" style="width:100%;border-collapse:collapse;${FONT}margin-bottom:10px"><tr>` +
    `<td style="${B}width:${logo.width + 14}px;padding:6px;text-align:center;vertical-align:middle">` +
    `<img src="${esc(logo.src)}" width="${logo.width}" height="${logo.height}" alt="" style="width:${logo.width}px;height:${logo.height}px;max-width:none"></td>` +
    `<td style="${B}padding:6px 10px;text-align:center;vertical-align:middle">${org}` +
    `<p style="margin:${org ? '6px' : '0'} 0 0;font-weight:bold;font-size:13pt">${esc(form.title)}</p></td>` +
    (metaRows
      ? `<td style="${B}width:230px;padding:0;vertical-align:middle"><table style="width:100%;border-collapse:collapse;${FONT}">${metaRows}</table></td>`
      : '') +
    `</tr></table>`;

  const th = (t, extra = '') =>
    `<th style="${B}padding:5px 6px;background:#f0f0f0;font-size:10pt;font-weight:bold;text-align:center;vertical-align:middle;${extra}">${esc(t)}</th>`;
  const head = `<thead style="display:table-header-group"><tr style="mso-yfti-irow:-1;mso-yfti-firstrow:yes">${th('№', 'width:32px')}${fields
    .map((f) => th(f.label))
    .join('')}</tr></thead>`;
  const list = rows.length ? rows : Array.from({ length: blankRows }, () => null);
  const body = list
    .map(
      (r, i) =>
        `<tr data-row="1"><td style="${B}padding:4px 6px;font-size:10pt;text-align:center">${r ? i + 1 : '&nbsp;'}</td>${fields
          .map(
            (f) =>
              `<td style="${B}padding:4px 6px;font-size:10pt;vertical-align:top;white-space:pre-wrap">${r ? esc(displayValue(f, r.data?.[f.key])) : ''}&nbsp;</td>`
          )
          .join('')}</tr>`
    )
    .join('');
  const tableHtml = `<table data-part="table" style="width:100%;border-collapse:collapse;${FONT}">${head}<tbody>${body}</tbody></table>`;
  return { headerHtml, tableHtml, html: headerHtml + tableHtml, orientation: header.orientation };
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

function bytesToBase64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/.{76}/g, '$&\r\n');
}

// Word: MHTML (.doc) — rasm (logo) fayl ichiga joylanadi, Word to'g'ridan-to'g'ri ochadi.
export async function exportWord({ form, lab, rows }) {
  const logoInfo = await getFormLogo();
  const logoRes = await fetch(logoInfo.src);
  const logo = new Uint8Array(await logoRes.arrayBuffer());
  const logoType = /jpe?g/i.test(logoRes.headers.get('content-type') || '') ? 'image/jpeg' : 'image/png';
  const LOGO_LOC = `file:///C:/slm/logo.${logoType === 'image/jpeg' ? 'jpg' : 'png'}`;
  const { html, orientation } = buildDocumentHtml({ form, lab, rows, logo: { ...logoInfo, src: LOGO_LOC } });
  const land = orientation === 'landscape';
  const page = land
    ? 'size:841.9pt 595.3pt;mso-page-orientation:landscape;margin:36pt 36pt 36pt 36pt;'
    : 'size:595.3pt 841.9pt;margin:42pt 36pt 42pt 54pt;';
  const doc =
    `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">` +
    `<head><meta charset="utf-8"><title>${esc(form.title)}</title>` +
    `<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->` +
    `<style>@page WordSection1{${page}} div.WordSection1{page:WordSection1;} table{mso-table-layout-alt:fixed;} td,th{mso-border-alt:solid windowtext .5pt;}</style>` +
    `</head><body><div class="WordSection1">${html}</div></body></html>`;
  const boundary = '----=_NextPart_SLM_SMK';
  const mhtml = [
    'MIME-Version: 1.0',
    `Content-Type: multipart/related; boundary="${boundary}"; type="text/html"`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="utf-8"',
    'Content-Transfer-Encoding: base64',
    'Content-Location: file:///C:/slm/document.htm',
    '',
    bytesToBase64(new TextEncoder().encode(doc)),
    '',
    `--${boundary}`,
    `Content-Type: ${logoType}`,
    'Content-Transfer-Encoding: base64',
    `Content-Location: ${LOGO_LOC}`,
    '',
    bytesToBase64(logo),
    '',
    `--${boundary}--`,
    '',
  ].join('\r\n');
  saveBlob(new Blob([mhtml], { type: 'application/msword' }), `${fileBase(form, lab)}.doc`);
}

// PDF: hujjat ekrandan tashqarida chiziladi (html2canvas), sahifalarga qator
// chegarasidan bo'linadi (qator ikki sahifaga yorilmaydi), jadval sarlavhasi
// har bir keyingi sahifada takrorlanadi.
export async function exportPdf({ form, lab, rows }) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
  const { html, orientation } = buildDocumentHtml({ form, lab, rows, logo: await getFormLogo() });
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
    const canvas = await html2canvas(box, { scale, backgroundColor: '#ffffff' });
    const top0 = box.getBoundingClientRect().top;
    const px = (y) => Math.round((y - top0) * scale);
    const thead = box.querySelector('[data-part="table"] thead').getBoundingClientRect();
    const theadTop = px(thead.top);
    const theadH = px(thead.bottom) - theadTop;
    // Bo'linish mumkin bo'lgan nuqtalar: shapka va thead oxiri, har bir qator oxiri.
    const breaks = [px(thead.bottom), ...[...box.querySelectorAll('tr[data-row]')].map((tr) => px(tr.getBoundingClientRect().bottom))];

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
export async function printDocument({ form, lab, rows }, w) {
  if (!w) return;
  const logo = await getFormLogo();
  const { html, orientation } = buildDocumentHtml({ form, lab, rows, logo: { ...logo, src: new URL(logo.src, window.location.origin).href } });
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
