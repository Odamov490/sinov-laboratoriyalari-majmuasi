import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, X, ChevronLeft, Pencil, ListChecks, GripVertical } from 'lucide-react';
import { adminProductBuilder, adminTestIndicators } from '../../services/adminApi';
import { Loading, ErrorState, EmptyState } from '../../components/StateViews.jsx';
import { Modal } from '../../components/Modal.jsx';
import { useToast } from '../../context/ToastContext.jsx';

// Search-as-you-type picker over the full TestIndicator pool, shown inside
// a modal (see the shared "picker" Modal below) rather than inline — with
// 2500+ indicators, an always-rendered inline list made the page balloon to
// several screens tall. No searchable combobox component exists elsewhere
// in the codebase, so this is a minimal one built just for this page
// (client-side filter over an already-fetched pool).
function IndicatorPicker({ pool, excludeIds, onAdd, adding }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pool
      .filter((i) => !excludeIds.has(i.id))
      .filter(
        (i) =>
          !q ||
          i.nameUz.toLowerCase().includes(q) ||
          (i.standardCode || '').toLowerCase().includes(q) ||
          (i.positionCode || '').toLowerCase().includes(q)
      )
      .slice(0, 50);
  }, [pool, excludeIds, query]);

  return (
    <div>
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Nomi, standart yoki pozitsiya kodi bo'yicha qidiring..."
        className="input-field"
      />
      <div className="mt-3 max-h-96 overflow-y-auto space-y-1">
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-400 px-1 py-4 text-center">Hech narsa topilmadi.</p>
        ) : (
          filtered.map((i) => (
            <button
              key={i.id}
              type="button"
              disabled={adding === i.id}
              onClick={() => onAdd(i.id)}
              className="w-full flex items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-bg-light disabled:opacity-50"
            >
              <span className="truncate">
                {i.positionCode && <span className="text-slate-400">#{i.positionCode} </span>}
                {i.nameUz}
                {i.standardCode && <span className="text-slate-400"> — {i.standardCode}</span>}
              </span>
              <Plus className="h-3.5 w-3.5 text-primary shrink-0" />
            </button>
          ))
        )}
        {filtered.length === 50 && (
          <p className="text-xs text-slate-400 px-2 py-1">Faqat birinchi 50 ta natija ko'rsatilmoqda — aniqroq qidiring.</p>
        )}
      </div>
    </div>
  );
}

// Already-attached indicators for one context (baseline or one option) —
// capped height + scroll so a long list doesn't push the rest of the page
// down. Drag-and-drop reordering (native HTML5 DnD, no extra dependency)
// is enabled whenever a parent passes onReorder; the list re-sorts
// optimistically as soon as the drop lands, then persists the new order.
function AssignmentList({ assignments, onRemove, busy, emptyLabel, onReorder }) {
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);

  if (assignments.length === 0) return <p className="text-xs text-slate-400">{emptyLabel}</p>;

  const handleDrop = (targetId) => {
    setOverId(null);
    if (!dragId || dragId === targetId) {
      setDragId(null);
      return;
    }
    const fromIndex = assignments.findIndex((a) => a.id === dragId);
    const toIndex = assignments.findIndex((a) => a.id === targetId);
    setDragId(null);
    if (fromIndex === -1 || toIndex === -1) return;
    const reordered = [...assignments];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    onReorder?.(reordered.map((a) => a.id));
  };

  return (
    <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
      {assignments.map((a) => (
        <div
          key={a.id}
          draggable={!!onReorder}
          onDragStart={() => setDragId(a.id)}
          onDragOver={(e) => {
            e.preventDefault();
            if (overId !== a.id) setOverId(a.id);
          }}
          onDragLeave={() => setOverId((cur) => (cur === a.id ? null : cur))}
          onDrop={(e) => {
            e.preventDefault();
            handleDrop(a.id);
          }}
          onDragEnd={() => {
            setDragId(null);
            setOverId(null);
          }}
          className={overId === a.id && dragId && dragId !== a.id ? 'rounded-lg ring-2 ring-primary' : ''}
        >
          <AssignmentChip
            assignment={a}
            onRemove={onRemove}
            removing={busy === a.id}
            draggable={!!onReorder}
          />
        </div>
      ))}
    </div>
  );
}

function AssignmentChip({ assignment, onRemove, removing, draggable }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm ${
        draggable ? 'cursor-move' : ''
      }`}
    >
      {draggable && <GripVertical className="h-4 w-4 text-slate-300 shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="font-medium text-ink truncate">
          {assignment.indicator?.positionCode && (
            <span className="text-slate-400">#{assignment.indicator.positionCode} </span>
          )}
          {assignment.indicator?.nameUz}
        </p>
        {(assignment.indicator?.standardCode || assignment.indicator?.unit) && (
          <p className="text-xs text-slate-400 truncate">
            {[assignment.indicator?.standardCode, assignment.indicator?.unit].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
      <button
        type="button"
        disabled={removing}
        onClick={() => onRemove(assignment.id)}
        className="shrink-0 text-slate-400 hover:text-red-600 disabled:opacity-50"
        aria-label="o'chirish"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

const emptyQuestion = { questionUz: '', questionRu: '', questionEn: '', order: 0 };
const emptyOption = { labelUz: '', labelRu: '', labelEn: '', order: 0 };

export default function AdminTestProgramBuilder() {
  const { id } = useParams();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [error, setError] = useState(false);
  const [pool, setPool] = useState([]);
  const [busy, setBusy] = useState(null);

  const [questionModal, setQuestionModal] = useState(null); // { mode, data, questionId? }
  const [optionModal, setOptionModal] = useState(null); // { mode, data, questionId, optionId? }
  const [pickerTarget, setPickerTarget] = useState(null); // { conditionOptionId, label }
  const [saving, setSaving] = useState(false);

  const load = () => {
    setError(false);
    adminProductBuilder
      .get(id)
      .then(setProduct)
      .catch(() => setError(true));
  };

  useEffect(() => {
    setProduct(null);
    load();
    adminTestIndicators
      .list({ pageSize: 3000 })
      .then((d) => setPool(d.items))
      .catch(() => setPool([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (error) return <ErrorState onRetry={load} />;
  if (!product) return <Loading />;

  const baselineAssignments = product.indicators.filter((a) => !a.conditionOptionId);

  // Which indicators to hide from the picker is scoped to the target
  // (baseline, or one specific option) being edited — the same indicator
  // can legitimately be attached separately to several different options
  // (or to both baseline and an option), so "already attached somewhere on
  // this product" must never be used as the exclusion set here.
  const attachedIndicatorIdsFor = (conditionOptionId) =>
    new Set(
      product.indicators
        .filter((a) => (a.conditionOptionId || null) === (conditionOptionId || null))
        .map((a) => a.indicatorId)
    );

  const addIndicator = async (conditionOptionId, indicatorId) => {
    setBusy(indicatorId);
    try {
      await adminProductBuilder.addIndicator(id, { indicatorId, conditionOptionId: conditionOptionId || undefined });
      load();
    } catch {
      showToast("Ko'rsatkich qo'shishda xatolik yuz berdi.", 'error');
    } finally {
      setBusy(null);
    }
  };

  const removeAssignment = async (assignmentId) => {
    setBusy(assignmentId);
    try {
      await adminProductBuilder.removeIndicator(id, assignmentId);
      load();
    } catch {
      showToast("O'chirishda xatolik yuz berdi.", 'error');
    } finally {
      setBusy(null);
    }
  };

  const reorderAssignments = async (assignmentIds) => {
    try {
      await adminProductBuilder.reorderIndicators(id, assignmentIds);
      load();
    } catch {
      showToast("Tartibni saqlashda xatolik yuz berdi.", 'error');
    }
  };

  const saveQuestion = async () => {
    setSaving(true);
    try {
      if (questionModal.mode === 'create') {
        const created = await adminProductBuilder.addQuestion(id, questionModal.data);
        // Binary shortcut: instead of making the admin add "Ha"/"Yo'q" as
        // two separate manual options, create them automatically so the
        // question is immediately ready for indicators to be attached.
        if (questionModal.binary) {
          await adminProductBuilder.addOption(id, created.id, { labelUz: 'Ha', labelRu: 'Да', labelEn: 'Yes', order: 0 });
          await adminProductBuilder.addOption(id, created.id, { labelUz: "Yo'q", labelRu: 'Нет', labelEn: 'No', order: 1 });
        }
      } else {
        await adminProductBuilder.updateQuestion(id, questionModal.questionId, questionModal.data);
      }
      setQuestionModal(null);
      load();
      showToast('Saqlandi.', 'success');
    } catch {
      showToast('Saqlashda xatolik yuz berdi.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeQuestion = async (questionId) => {
    if (!window.confirm("Savol va unga tegishli barcha variantlar/ko'rsatkichlar o'chiriladi. Davom etilsinmi?")) return;
    setBusy(questionId);
    try {
      await adminProductBuilder.removeQuestion(id, questionId);
      load();
    } catch {
      showToast("O'chirishda xatolik yuz berdi.", 'error');
    } finally {
      setBusy(null);
    }
  };

  const saveOption = async () => {
    setSaving(true);
    try {
      if (optionModal.mode === 'create') {
        await adminProductBuilder.addOption(id, optionModal.questionId, optionModal.data);
      } else {
        await adminProductBuilder.updateOption(id, optionModal.questionId, optionModal.optionId, optionModal.data);
      }
      setOptionModal(null);
      load();
      showToast('Saqlandi.', 'success');
    } catch {
      showToast('Saqlashda xatolik yuz berdi.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeOption = async (questionId, optionId) => {
    if (!window.confirm("Variant va unga bog'liq ko'rsatkichlar o'chiriladi. Davom etilsinmi?")) return;
    setBusy(optionId);
    try {
      await adminProductBuilder.removeOption(id, questionId, optionId);
      load();
    } catch {
      showToast("O'chirishda xatolik yuz berdi.", 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <Link to="/admin/sinov-dasturlari" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary">
        <ChevronLeft className="h-4 w-4" /> Mahsulotlarga qaytish
      </Link>
      <div className="mt-2 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-primary">{product.nameUz}</h1>
          <p className="text-sm text-slate-500">{product.laboratory?.nameUz}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: baseline (always-included) indicators */}
        <div className="card p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold text-ink flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-primary" /> Asosiy ko'rsatkichlar
            </h2>
            <span className="text-xs font-medium text-slate-400 shrink-0">{baselineAssignments.length} ta</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Har doim sinov dasturiga kiritiladi.</p>

          <div className="mt-3">
            <AssignmentList
              assignments={baselineAssignments}
              onRemove={removeAssignment}
              busy={busy}
              emptyLabel="Hali qo'shilmagan."
              onReorder={reorderAssignments}
            />
          </div>

          <button
            className="btn-secondary !py-2 !px-3 text-sm w-full mt-3 justify-center"
            onClick={() => setPickerTarget({ conditionOptionId: null, label: "Asosiy ko'rsatkichlar" })}
          >
            <Plus className="h-4 w-4" /> Ko'rsatkich qo'shish
          </button>
        </div>

        {/* Right: questions, each with options and their conditional indicators */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink">Savollar</h2>
            <button
              className="btn-secondary !py-2 !px-3 text-sm inline-flex items-center gap-1.5"
              onClick={() => setQuestionModal({ mode: 'create', data: { ...emptyQuestion }, binary: false })}
            >
              <Plus className="h-4 w-4" /> Savol qo'shish
            </button>
          </div>

          {product.questions.length === 0 && <EmptyState message="Hali savollar qo'shilmagan." />}

          {product.questions.map((q) => (
            <div key={q.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-ink">{q.questionUz}</p>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-bg-light"
                    onClick={() =>
                      setQuestionModal({
                        mode: 'edit',
                        questionId: q.id,
                        data: {
                          questionUz: q.questionUz,
                          questionRu: q.questionRu,
                          questionEn: q.questionEn,
                          order: q.order,
                        },
                      })
                    }
                    aria-label="tahrirlash"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    disabled={busy === q.id}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-bg-light disabled:opacity-50"
                    onClick={() => removeQuestion(q.id)}
                    aria-label="o'chirish"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {q.options.map((opt) => {
                  const optionAssignments = product.indicators.filter((a) => a.conditionOptionId === opt.id);
                  return (
                    <div key={opt.id} className="rounded-lg bg-bg-light/60 border border-border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-ink">{opt.labelUz}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            className="p-1 rounded-lg text-slate-400 hover:text-primary"
                            onClick={() =>
                              setOptionModal({
                                mode: 'edit',
                                questionId: q.id,
                                optionId: opt.id,
                                data: { labelUz: opt.labelUz, labelRu: opt.labelRu, labelEn: opt.labelEn, order: opt.order },
                              })
                            }
                            aria-label="tahrirlash"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            disabled={busy === opt.id}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-600 disabled:opacity-50"
                            onClick={() => removeOption(q.id, opt.id)}
                            aria-label="o'chirish"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-slate-500">Shu variantga xos ko'rsatkichlar:</p>
                        <span className="text-xs text-slate-400 shrink-0">{optionAssignments.length} ta</span>
                      </div>
                      <div className="mt-1.5">
                        <AssignmentList
                          assignments={optionAssignments}
                          onRemove={removeAssignment}
                          busy={busy}
                          emptyLabel="Hali qo'shilmagan."
                          onReorder={reorderAssignments}
                        />
                      </div>
                      <button
                        className="text-sm font-medium text-primary inline-flex items-center gap-1.5 hover:underline mt-2"
                        onClick={() => setPickerTarget({ conditionOptionId: opt.id, label: opt.labelUz })}
                      >
                        <Plus className="h-3.5 w-3.5" /> Ko'rsatkich qo'shish
                      </button>
                    </div>
                  );
                })}

                <button
                  className="text-sm font-medium text-primary inline-flex items-center gap-1.5 hover:underline"
                  onClick={() => setOptionModal({ mode: 'create', questionId: q.id, data: { ...emptyOption } })}
                >
                  <Plus className="h-3.5 w-3.5" /> Variant qo'shish
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        open={!!questionModal}
        onClose={() => setQuestionModal(null)}
        title={questionModal?.mode === 'edit' ? 'Savolni tahrirlash' : 'Yangi savol'}
      >
        {questionModal && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400 -mt-1">
              Savol shaklida yozing (masalan "Ishlaydigan kuchlanish?"), keyingi qadamda uning variantlarini
              (220V, 380V...) qo'shasiz.
            </p>
            <input
              className="input-field"
              placeholder='Savol (UZ) — masalan "Ishlaydigan kuchlanish?"'
              value={questionModal.data.questionUz}
              onChange={(e) => setQuestionModal({ ...questionModal, data: { ...questionModal.data, questionUz: e.target.value } })}
            />
            <input
              className="input-field"
              placeholder="Savol (RU)"
              value={questionModal.data.questionRu}
              onChange={(e) => setQuestionModal({ ...questionModal, data: { ...questionModal.data, questionRu: e.target.value } })}
            />
            <input
              className="input-field"
              placeholder="Savol (EN)"
              value={questionModal.data.questionEn}
              onChange={(e) => setQuestionModal({ ...questionModal, data: { ...questionModal.data, questionEn: e.target.value } })}
            />
            {questionModal.mode === 'create' && (
              <label className="flex items-start gap-2.5 rounded-lg border border-border bg-bg-light/60 px-3 py-2.5 text-sm text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!questionModal.binary}
                  onChange={(e) => setQuestionModal({ ...questionModal, binary: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary shrink-0"
                />
                <span>
                  <span className="font-medium">Ha / Yo'q savoli sifatida yaratish</span>
                  <span className="block text-xs text-slate-500 mt-0.5">
                    "Ha" va "Yo'q" variantlari avtomatik qo'shiladi — o'zingiz alohida yaratmaysiz.
                  </span>
                </span>
              </label>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Tartib raqami (bir nechta savol bo'lsa, kichik raqam avvalroq chiqadi)
              </label>
              <input
                type="number"
                className="input-field"
                value={questionModal.data.order}
                onChange={(e) => setQuestionModal({ ...questionModal, data: { ...questionModal.data, order: e.target.value } })}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button className="btn-secondary" onClick={() => setQuestionModal(null)}>
                Bekor qilish
              </button>
              <button disabled={saving} className="btn-primary" onClick={saveQuestion}>
                Saqlash
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!optionModal}
        onClose={() => setOptionModal(null)}
        title={optionModal?.mode === 'edit' ? 'Variantni tahrirlash' : 'Yangi variant'}
        size="sm"
      >
        {optionModal && (
          <div className="space-y-3">
            <input
              className="input-field"
              placeholder="Variant (UZ) — masalan 220V"
              value={optionModal.data.labelUz}
              onChange={(e) => setOptionModal({ ...optionModal, data: { ...optionModal.data, labelUz: e.target.value } })}
            />
            <input
              className="input-field"
              placeholder="Variant (RU)"
              value={optionModal.data.labelRu}
              onChange={(e) => setOptionModal({ ...optionModal, data: { ...optionModal.data, labelRu: e.target.value } })}
            />
            <input
              className="input-field"
              placeholder="Variant (EN)"
              value={optionModal.data.labelEn}
              onChange={(e) => setOptionModal({ ...optionModal, data: { ...optionModal.data, labelEn: e.target.value } })}
            />
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Tartib raqami (bir nechta variant bo'lsa, kichik raqam avvalroq chiqadi)
              </label>
              <input
                type="number"
                className="input-field"
                value={optionModal.data.order}
                onChange={(e) => setOptionModal({ ...optionModal, data: { ...optionModal.data, order: e.target.value } })}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button className="btn-secondary" onClick={() => setOptionModal(null)}>
                Bekor qilish
              </button>
              <button disabled={saving} className="btn-primary" onClick={saveOption}>
                Saqlash
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!pickerTarget}
        onClose={() => setPickerTarget(null)}
        title={pickerTarget ? `Ko'rsatkich qo'shish — ${pickerTarget.label}` : ''}
        size="lg"
      >
        {pickerTarget && (
          <IndicatorPicker
            pool={pool}
            excludeIds={attachedIndicatorIdsFor(pickerTarget.conditionOptionId)}
            adding={busy}
            onAdd={(indicatorId) => addIndicator(pickerTarget.conditionOptionId, indicatorId)}
          />
        )}
      </Modal>
    </div>
  );
}
