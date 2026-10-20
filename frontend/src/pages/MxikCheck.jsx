import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Info, Loader2, ExternalLink } from 'lucide-react';
import SEO from '../components/SEO.jsx';
import { Breadcrumb } from '../components/UI.jsx';

const MXIK_SEARCH_URL = 'https://mxik-uz.vercel.app/';

// The external site's own footer (its Telegram channel, sources, data
// status) is hidden when embedded here.
const MXIK_HIDE_CSS = '<style>.site-foot{display:none!important}</style>';

// The sandboxed (opaque-origin) frame is denied clipboard access, so its
// navigator.clipboard.writeText is replaced with a bridge that asks this page
// to do the copy (see the message listener in MxikCheck).
const MXIK_CLIPBOARD_BRIDGE = `<script>(function(){
  var seq = 0, pending = {};
  addEventListener("message", function(e){
    var d = e.data;
    if (e.source !== parent || !d || d.type !== "mxik-copy-result" || !pending[d.id]) return;
    pending[d.id][d.ok ? 0 : 1](); delete pending[d.id];
  });
  function writeText(text){
    return new Promise(function(resolve, reject){
      var id = ++seq; pending[id] = [resolve, reject];
      parent.postMessage({ type: "mxik-copy", id: id, text: String(text) }, "*");
      setTimeout(function(){ if (pending[id]) { delete pending[id]; reject(new Error("timeout")); } }, 3000);
    });
  }
  try { Object.defineProperty(navigator, "clipboard", { value: { writeText: writeText }, configurable: true }); } catch (e) {}
})();</script>`;

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

// External MXIK code search (activity / product name / TIF TN code -> MXIK).
// The site is a single self-contained static HTML page served with CORS "*",
// so it is fetched, its footer hidden via injected CSS, and rendered through
// srcdoc in a sandbox (opaque origin — its scripts can't touch this site).
// If the fetch fails, the plain URL is embedded instead.
export default function MxikCheck() {
  const { t } = useTranslation();
  const [srcDoc, setSrcDoc] = useState(null);
  const [failed, setFailed] = useState(false);
  const frameRef = useRef(null);

  useEffect(() => {
    const onMessage = async (e) => {
      const frame = frameRef.current;
      const d = e.data;
      if (!frame || e.source !== frame.contentWindow || !d || d.type !== 'mxik-copy') return;
      const ok = await copyToClipboard(String(d.text));
      frame.contentWindow?.postMessage({ type: 'mxik-copy-result', id: d.id, ok }, '*');
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(MXIK_SEARCH_URL)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.text();
      })
      .then((html) => {
        if (cancelled) return;
        setSrcDoc(
          html
            .replace(/<head([^>]*)>/i, `<head$1>${MXIK_CLIPBOARD_BRIDGE}`)
            .replace(/<\/head>/i, `${MXIK_HIDE_CSS}</head>`),
        );
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="section container-page max-w-6xl">
      <SEO title={t('nav.mxikCheck')} description={t('mxikCheck.subtitle')} />
      <Breadcrumb items={[{ label: t('nav.mxikCheck') }]} />
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-primary">{t('mxikCheck.title')}</h1>
          <p className="mt-2 text-sm text-slate-500">{t('mxikCheck.subtitle')}</p>
        </div>
        <a
          href={MXIK_SEARCH_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          {t('mxikCheck.openNew')} <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {/* Attribution: the embedded search and its data belong to a third
          party, and its own footer (credits, sources) is hidden below. */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 mt-0.5 shrink-0 text-slate-500" />
          <div className="min-w-0 flex-1 text-sm text-slate-600 leading-relaxed">
            <p className="font-semibold text-ink">{t('mxikCheck.sourceTitle')}</p>
            <p className="mt-1">
              {t('mxikCheck.sourceText')}{' '}
              <a
                href={MXIK_SEARCH_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                mxik-uz.vercel.app
              </a>
              . {t('mxikCheck.sourceAuthor')} (
              <a
                href="https://t.me/buxgalteriyabojxona"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                @buxgalteriyabojxona
              </a>
              ).
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {t('mxikCheck.disclaimer')}{' '}
              <a
                href="https://tasnif.soliq.uz"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                tasnif.soliq.uz
              </a>
              .
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 card overflow-hidden p-0">
        {srcDoc ? (
          <iframe
            ref={frameRef}
            srcDoc={srcDoc}
            title={t('mxikCheck.title')}
            sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
            allow="clipboard-write"
            className="block w-full h-[80vh] min-h-[600px] border-0"
          />
        ) : failed ? (
          <iframe
            src={MXIK_SEARCH_URL}
            title={t('mxikCheck.title')}
            className="block w-full h-[80vh] min-h-[600px] border-0"
          />
        ) : (
          <div className="flex h-[80vh] min-h-[600px] items-center justify-center text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
