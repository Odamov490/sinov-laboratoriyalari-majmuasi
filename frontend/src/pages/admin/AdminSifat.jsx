import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FlaskConical, Search, ArrowRight, FileText, ListPlus, Library, Layers, PenLine, Sparkles, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { adminSmk } from '../../services/adminApi';
import { Loading, EmptyState, ErrorState } from '../../components/StateViews.jsx';
import { Modal, ConfirmDialog } from '../../components/Modal.jsx';
import { tr, locName } from '../../i18n/tr.js';

// Har bir laboratoriyaga o'z rangi (tartib raqami bo'yicha, barqaror).
const HUES = [
  ['#0B3A63', '#2B7BB9'],
  ['#0F766E', '#2DD4BF'],
  ['#7C3AED', '#C084FC'],
  ['#B45309', '#F59E0B'],
  ['#BE123C', '#FB7185'],
  ['#1D4ED8', '#60A5FA'],
  ['#15803D', '#4ADE80'],
  ['#9333EA', '#F472B6'],
  ['#0E7490', '#22D3EE'],
  ['#A16207', '#FACC15'],
];
const hue = (i) => HUES[i % HUES.length];
const initials = (name) =>
  (name || '')
    .split(/\s+/)
    .filter((w) => /^[\p{L}]/u.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

// Sifat bo'limi: chapda laboratoriyalar ro'yxati (rangli kartalar),
// o'ngda tanlangan laboratoriyaning SMK formalari "hujjat varag'i" ko'rinishida.
// Tanlangan laboratoriya URL'da (?lab=<slug>) saqlanadi.
export default function AdminSifat() {
  const { user } = useAuth();
  const [labs, setLabs] = useState(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [picking, setPicking] = useState(null); // lab
  const [params, setParams] = useSearchParams();

  const load = useCallback(() => {
    setError(false);
    adminSmk
      .board()
      .then((d) => setLabs(d.labs || []))
      .catch(() => setError(true));
  }, []);
  useEffect(load, [load]);

  const q = query.trim().toLowerCase();
  const match = useCallback((f) => !q || `${f.code} ${f.title}`.toLowerCase().includes(q), [q]);

  const stats = useMemo(() => {
    const list = labs || [];
    return {
      labs: list.length,
      forms: list.reduce((s, l) => s + l.forms.length, 0),
      entries: list.reduce((s, l) => s + l.forms.reduce((a, f) => a + (f.entryCount || 0), 0), 0),
      max: Math.max(1, ...list.map((l) => l.forms.length)),
    };
  }, [labs]);

  if (error) return <ErrorState onRetry={load} />;
  if (labs === null) return <Loading />;

  const activeIdx = Math.max(0, labs.findIndex((l) => l.slug === params.get('lab')));
  const active = labs[activeIdx];
  const choose = (lab) => setParams({ lab: lab.slug }, { replace: true });

  return (
    <div className="space-y-5">
      {/* --- Sarlavha banneri --- */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 text-white shadow-card"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(135deg, #0B3A63, #155D8A)', backgroundSize: '18px 18px, 100% 100%' }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/25 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 right-1/3 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-xl">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> SMK
            </div>
            <h1 className="text-2xl font-bold">{tr('Sifat menejmenti: laboratoriyalar')}</h1>
            <p className="mt-1 text-sm text-white/75">{tr('Har bir laboratoriya o\'ziga kerakli SMK formalarini tanlaydi va to\'ldiradi.')}</p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            {user.role === 'SUPER_ADMIN' && (
              <Link
                to="/admin/sifat-formalar"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-primary shadow transition hover:bg-accent hover:text-white"
              >
                <Library className="h-4 w-4" /> {tr('Formalar kutubxonasi')}
              </Link>
            )}
            <label className="relative block w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 z-10 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tr('Forma qidirish')}
                className="w-full rounded-lg border border-white/25 bg-white/10 py-2.5 pl-9 pr-3 text-sm text-white placeholder-white/60 outline-none backdrop-blur focus:border-white/60 focus:bg-white/15"
              />
            </label>
          </div>
        </div>
        <div className="relative mt-6 grid grid-cols-3 gap-3 sm:max-w-xl">
          <Stat icon={FlaskConical} value={stats.labs} label={tr('Laboratoriyalar')} />
          <Stat icon={Layers} value={stats.forms} label={tr('Biriktirilgan formalar')} />
          <Stat icon={PenLine} value={stats.entries} label={tr('Jami yozuvlar')} />
        </div>
      </div>

      {labs.length === 0 ? (
        <EmptyState message={tr('Laboratoriya topilmadi.')} />
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[320px_1fr]">
          {/* --- Laboratoriyalar ro'yxati --- */}
          <div className="-m-1 flex gap-2 overflow-x-auto p-1 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:flex-col lg:overflow-y-auto lg:overflow-x-visible">
            {labs.map((lab, i) => {
              const [c1, c2] = hue(i);
              const on = i === activeIdx;
              const hits = q ? lab.forms.filter(match).length : null;
              const entries = lab.forms.reduce((a, f) => a + (f.entryCount || 0), 0);
              return (
                <button
                  key={lab.id}
                  type="button"
                  onClick={() => choose(lab)}
                  data-testid="sifat-lab"
                  className={`group relative flex w-64 shrink-0 items-center gap-3 rounded-xl border p-3 text-left transition lg:w-auto ${
                    on ? 'border-transparent bg-white shadow-card ring-2' : 'border-border bg-white/60 hover:bg-white hover:shadow-card'
                  } ${hits === 0 ? 'opacity-50' : ''}`}
                  style={on ? { '--tw-ring-color': c1 } : undefined}
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm transition group-hover:scale-105"
                    style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                  >
                    {initials(locName(lab)) || <FlaskConical className="h-5 w-5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-[13px] font-semibold leading-snug text-ink">{locName(lab)}</span>
                    <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-slate-100">
                      <span
                        className="block h-full rounded-full transition-all"
                        style={{ width: `${(lab.forms.length / stats.max) * 100}%`, background: `linear-gradient(90deg, ${c1}, ${c2})` }}
                      />
                    </span>
                    <span className="mt-1 flex gap-3 text-[11px] text-slate-500">
                      <span>{tr('{0} forma', lab.forms.length)}</span>
                      <span>{tr('{0} yozuv', entries)}</span>
                    </span>
                  </span>
                  {hits !== null && hits > 0 && (
                    <span className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: c1 }}>{hits}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* --- Tanlangan laboratoriya --- */}
          <LabPanel
            key={active.id}
            lab={active}
            colors={hue(activeIdx)}
            forms={active.forms.filter(match)}
            searching={!!q}
            onPick={() => setPicking(active)}
            onChanged={load}
          />
        </div>
      )}

      {picking && <FormPicker lab={picking} onClose={() => setPicking(null)} onSaved={load} />}
    </div>
  );
}

function Stat({ icon: Icon, value, label }) {
  return (
    <div className="rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur">
      <div className="flex items-center gap-2 text-2xl font-bold leading-none">
        {value}
        <Icon className="h-4 w-4 text-accent" />
      </div>
      <div className="mt-1 text-[11px] leading-tight text-white/70">{label}</div>
    </div>
  );
}

function LabPanel({ lab, colors: [c1, c2], forms, searching, onPick, onChanged }) {
  const { showToast } = useToast();
  const [removing, setRemoving] = useState(null); // forma
  const entries = lab.forms.reduce((a, f) => a + (f.entryCount || 0), 0);

  // Formani laboratoriyadan ajratish (yozuvlari o'chmaydi — qayta tanlansa ko'rinadi).
  const remove = async (form) => {
    try {
      await adminSmk.setLabForms(lab.id, lab.forms.filter((f) => f.id !== form.id).map((f) => f.id));
      showToast(tr('Forma laboratoriyadan olib tashlandi.'), 'success');
      onChanged();
    } catch (err) {
      showToast(err?.response?.data?.error || tr('Xatolik yuz berdi.'), 'error');
    }
  };

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-white shadow-card">
      <header className="relative overflow-hidden px-6 py-5 text-white" style={{ background: `linear-gradient(120deg, ${c1}, ${c2})` }}>
        <FlaskConical className="pointer-events-none absolute -right-4 -top-6 h-36 w-36 rotate-12 text-white/10" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold leading-snug">{locName(lab)}</h2>
            <p className="mt-1 text-sm text-white/80">
              {tr('{0} forma', lab.forms.length)} · {tr('{0} yozuv', entries)}
            </p>
          </div>
          <button
            type="button"
            onClick={onPick}
            className="inline-flex items-center gap-2 rounded-lg bg-white/95 px-4 py-2 text-sm font-semibold shadow transition hover:bg-white"
            style={{ color: c1 }}
          >
            <ListPlus className="h-4 w-4" /> {tr('Formalarni tanlash')}
          </button>
        </div>
      </header>

      <div className="bg-bg-light/60 p-5">
        {lab.forms.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed" style={{ borderColor: c2 }}>
              <FileText className="h-9 w-9" style={{ color: c1 }} />
            </span>
            <p className="mt-4 font-semibold text-ink">{tr('Hali forma tanlanmagan.')}</p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">{tr('Kutubxonadan shu laboratoriyaga kerakli formalarni tanlang.')}</p>
            <button type="button" onClick={onPick} className="btn-primary mt-5 !py-2.5">
              <ListPlus className="h-4 w-4" /> {tr('Formalarni tanlash')}
            </button>
          </div>
        ) : forms.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">{searching ? tr('Hech narsa topilmadi.') : '—'}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {forms.map((f) => (
              <div key={f.id} className="group relative">
              <Link
                to={`/admin/sifat/${lab.slug}/${f.id}`}
                className="relative flex h-full min-h-[150px] flex-col rounded-lg border border-border bg-white p-4 pr-8 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-card"
              >
                {/* buklangan burchak — hujjat varag'i */}
                <span
                  className="absolute right-0 top-0 h-6 w-6 rounded-bl-md"
                  style={{ background: `linear-gradient(225deg, #F5F8FB 50%, ${c2}55 50%)` }}
                />
                <span className="absolute inset-y-4 left-0 w-1 rounded-r-full opacity-0 transition group-hover:opacity-100" style={{ background: c1 }} />
                <span className="inline-flex w-fit items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold" style={{ background: `${c1}14`, color: c1 }}>
                  <FileText className="h-3 w-3" /> {f.code}
                </span>
                <span className="mt-3 line-clamp-3 flex-1 text-sm font-medium leading-snug text-ink">{f.title}</span>
                <span className="mt-4 flex items-center justify-between border-t border-dashed border-border pt-3 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-slate-500">
                    <PenLine className="h-3.5 w-3.5" /> {tr('{0} yozuv', f.entryCount || 0)}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold transition group-hover:gap-2" style={{ color: c1 }}>
                    {tr('Ochish')} <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setRemoving(f)}
                title={tr('Laboratoriyadan olib tashlash')}
                aria-label={tr('Laboratoriyadan olib tashlash')}
                data-testid="sifat-remove-form"
                className="absolute right-8 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-white text-slate-400 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={() => remove(removing)}
        title={tr('Laboratoriyadan olib tashlash')}
        message={
          removing
            ? tr("«{0}» formasi shu laboratoriyadan olib tashlanadi. To'ldirilgan yozuvlari o'chmaydi — qayta tanlansa yana ko'rinadi.", `${removing.code} — ${removing.title}`)
            : ''
        }
      />
    </section>
  );
}

// Kutubxonadagi faol formalardan laboratoriya uchun keraklilarini belgilash.
function FormPicker({ lab, onClose, onSaved }) {
  const { showToast } = useToast();
  const [forms, setForms] = useState(null);
  const [selected, setSelected] = useState(() => new Set(lab.forms.map((f) => f.id)));
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminSmk
      .listForms({ active: 'true' })
      .then((d) => setForms(d.items || []))
      .catch(() => setForms([]));
  }, []);

  const q = query.trim().toLowerCase();
  const visible = useMemo(() => (forms || []).filter((f) => !q || `${f.code} ${f.title}`.toLowerCase().includes(q)), [forms, q]);
  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const save = async () => {
    setSaving(true);
    try {
      await adminSmk.setLabForms(lab.id, [...selected]);
      showToast(tr('Formalar saqlandi.'), 'success');
      onSaved();
      onClose();
    } catch (err) {
      showToast(err?.response?.data?.error || tr('Xatolik yuz berdi.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`${tr('Formalarni tanlash')} — ${locName(lab)}`} size="lg">
      {forms === null ? (
        <Loading />
      ) : forms.length === 0 ? (
        <EmptyState message={tr("Formalar kutubxonasi hozircha bo'sh.")} />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tr('Forma qidirish')}
              className="input-field !w-full sm:!w-64"
            />
            <span className="text-sm text-slate-500">{tr('Tanlangan: {0}', selected.size)}</span>
          </div>
          <div className="max-h-[50vh] space-y-1 overflow-y-auto rounded-lg border border-border p-2">
            {visible.map((f) => (
              <label key={f.id} className="flex cursor-pointer items-start gap-3 rounded px-2 py-2 text-sm hover:bg-bg-light">
                <input
                  type="checkbox"
                  checked={selected.has(f.id)}
                  onChange={() => toggle(f.id)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary"
                />
                <span>
                  <span className="mr-2 font-semibold text-slate-500">{f.code}</span>
                  <span className="text-ink">{f.title}</span>
                </span>
              </label>
            ))}
            {visible.length === 0 && <p className="px-2 py-2 text-sm text-slate-400">—</p>}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {tr("Forma olib tashlansa ham, uning to'ldirilgan yozuvlari o'chmaydi — qayta tanlansa yana ko'rinadi.")}
          </p>
        </>
      )}
      <div className="mt-5 flex justify-end gap-3">
        <button onClick={onClose} className="btn-secondary">{tr('Bekor qilish')}</button>
        <button onClick={save} disabled={saving || forms === null} className="btn-primary">
          {saving ? tr('Saqlanmoqda...') : tr('Saqlash')}
        </button>
      </div>
    </Modal>
  );
}
