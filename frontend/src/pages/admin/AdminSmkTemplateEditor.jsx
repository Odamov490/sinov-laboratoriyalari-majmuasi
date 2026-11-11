import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, AlertTriangle } from 'lucide-react';
import { adminSmk } from '../../services/adminApi';
import { Loading, ErrorState } from '../../components/StateViews.jsx';
import { tr, currentLang } from '../../i18n/tr.js';

// /admin/sifat/shablon/:formId — forma shablonini OnlyOffice'da ochish.
// SUPER_ADMIN .docx/.xlsx'ni tahrirlaydi (saqlash OnlyOffice -> backend
// callback orqali), boshqalar faqat ko'radi.

const loaded = new Map(); // api.js manzili -> Promise (bir marta yuklanadi)
function loadScript(src) {
  if (!loaded.has(src)) {
    loaded.set(
      src,
      new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => (window.DocsAPI ? resolve() : reject(new Error('no DocsAPI')));
        s.onerror = () => {
          loaded.delete(src);
          s.remove();
          reject(new Error('load'));
        };
        document.body.appendChild(s);
      })
    );
  }
  return loaded.get(src);
}

export default function AdminSmkTemplateEditor() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ status: 'loading' });
  const editorRef = useRef(null);

  useEffect(() => {
    let alive = true;
    setState({ status: 'loading' });
    adminSmk
      .editorConfig(formId, currentLang())
      .then(async (d) => {
        await loadScript(d.apiUrl);
        if (!alive) return;
        setState({ status: 'ready', canEdit: d.canEdit, title: d.config.document.title, url: d.config.document.url });
        // Konteyner render bo'lgandan keyin.
        requestAnimationFrame(() => {
          if (!alive) return;
          editorRef.current = new window.DocsAPI.DocEditor('slm-onlyoffice-editor', {
            ...d.config,
            width: '100%',
            height: '100%',
          });
        });
      })
      .catch((err) => {
        if (!alive) return;
        const data = err?.response?.data;
        if (data?.disabled) {
          setState({ status: 'disabled', download: data.download });
          return;
        }
        const msg = data?.error;
        setState({
          status: 'error',
          message: msg || (err?.message === 'load' || err?.message === 'no DocsAPI'
            ? tr("Onlayn muharrir (OnlyOffice) serveriga ulanib bo'lmadi.")
            : tr('Xatolik yuz berdi.')),
        });
      });
    return () => {
      alive = false;
      try {
        editorRef.current?.destroyEditor?.();
      } catch {
        // muharrir allaqachon yopilgan
      }
      editorRef.current = null;
    };
  }, [formId]);

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> {tr('Orqaga')}
        </button>
        {state.status === 'ready' && (
          <p className="text-xs text-slate-500">
            {state.canEdit
              ? tr("O'zgarishlar avtomatik saqlanadi; \"Saqlash\" tugmasi faylni darhol yangilaydi.")
              : tr("Ko'rish rejimi.")}
          </p>
        )}
      </div>
      {state.status === 'loading' && <Loading />}
      {state.status === 'disabled' && (
        <div className="mx-auto mt-10 max-w-md rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
          <p className="mt-3 text-sm text-amber-800">{ONLINE_DISABLED_MSG()}</p>
          {state.download?.url && (
            <a href={state.download.url} download={state.download.name || undefined} className="btn-primary mt-4 !py-2.5">
              <Download className="h-4 w-4" /> {tr('Shablonni yuklab olish')}
            </a>
          )}
        </div>
      )}
      {state.status === 'error' && <ErrorState message={state.message} onRetry={() => window.location.reload()} />}
      {state.status === 'ready' && (
        <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-white">
          <div id="slm-onlyoffice-editor" />
        </div>
      )}
    </div>
  );
}

// Jadval/sarlavhadagi "Ochish" tugmasi uchun: onlayn ochiladigan fayl turlari.
export const ONLINE_EXTS = ['docx', 'doc', 'xlsx', 'xls', 'pdf', 'odt', 'ods', 'rtf', 'txt', 'csv'];
export const canOpenOnline = (url) => ONLINE_EXTS.includes(String(url || '').split('.').pop().toLowerCase());

export const ONLINE_DISABLED_MSG = () => tr("Onlayn tahrirlash hozircha o'chirilgan, faylni yuklab olib tahrirlang.");

// OnlyOffice holati (30 soniya keshlanadi): null — yuklanmoqda.
let statusCache = { at: 0, promise: null };
export function useOnlyOfficeStatus() {
  const [status, setStatus] = useState(null);
  useEffect(() => {
    let alive = true;
    if (!statusCache.promise || Date.now() - statusCache.at > 30000) {
      statusCache = { at: Date.now(), promise: adminSmk.onlyofficeStatus().catch(() => ({ available: false })) };
    }
    statusCache.promise.then((d) => alive && setStatus(d));
    return () => {
      alive = false;
    };
  }, []);
  return status;
}
