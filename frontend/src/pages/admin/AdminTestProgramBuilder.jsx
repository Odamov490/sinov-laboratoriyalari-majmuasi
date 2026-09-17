import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, X, ChevronLeft, Pencil, ListChecks } from 'lucide-react';
import { adminProductBuilder, adminTestIndicators } from '../../services/adminApi';
import { Loading, ErrorState, EmptyState } from '../../components/StateViews.jsx';
import { Modal } from '../../components/Modal.jsx';
import { useToast } from '../../context/ToastContext.jsx';

// Small search-as-you-type picker over the full TestIndicator pool. No
// searchable combobox component exists elsewhere in the codebase yet, so
// this is a minimal one built just for this page (client-side filter over
// an already-fetched pool — the pool is small enough not to need a
// server-side search-as-you-type endpoint).
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
      .slice(0, 30);
  }, [pool, excludeIds, query]);

  return (
    <div className="mt-2 rounded-lg border border-dashed border-border p-2">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ko'rsatkich qidirish..."
        className="input-field !py-1.5 !text-sm"
      />
      <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
        {filtered.length === 0 ? (
          <p className="text-xs text-slate-400 px-1 py-2">Hech narsa topilmadi.</p>
        ) : (
          filtered.map((i) => (
            <button
              key={i.id}
              type="button"
              disabled={adding === i.id}
              onClick={() => onAdd(i.id)}
              className="w-full flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-bg-light disabled:opacity-50"
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
      </div>
    </div>
  );
}

function AssignmentChip({ assignment, onRemove, removing }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm">
      <div className="min-w-0">
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
      .list({ pageSize: 500 })
      .then((d) => setPool(d.items))
      .catch(() => setPool([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (error) return <ErrorState onRetry={load} />;
  if (!product) return <Loading />;

  const baselineAssignments = product.indicators.filter((a) => !a.conditionOptionId);
  const attachedIndicatorIds = new Set(product.indicators.map((a) => a.indicatorId));

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

  const saveQuestion = async () => {
    setSaving(true);
    try {
      if (questionModal.mode === 'create') {
        await adminProductBuilder.addQuestion(id, questionModal.data);
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
          <h2 className="font-semibold text-ink flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-primary" /> Asosiy ko'rsatkichlar
          </h2>
          <p className="mt-1 text-xs text-slate-400">Har doim sinov dasturiga kiritiladi.</p>

          <div className="mt-3 space-y-2">
            {baselineAssignments.length === 0 && <p className="text-xs text-slate-400">Hali qo'shilmagan.</p>}
            {baselineAssignments.map((a) => (
              <AssignmentChip key={a.id} assignment={a} onRemove={removeAssignment} removing={busy === a.id} />
            ))}
          </div>

          <IndicatorPicker
            pool={pool}
            excludeIds={attachedIndicatorIds}
            adding={busy}
            onAdd={(indicatorId) => addIndicator(null, indicatorId)}
          />
        </div>

        {/* Right: questions, each with options and their conditional indicators */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink">Savollar</h2>
            <button
              className="btn-secondary !py-2 !px-3 text-sm inline-flex items-center gap-1.5"
              onClick={() => setQuestionModal({ mode: 'create', data: { ...emptyQuestion } })}
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

                      <p className="mt-2 text-xs font-medium text-slate-500">Shu variantga xos ko'rsatkichlar:</p>
                      <div className="mt-1.5 space-y-1.5">
                        {optionAssignments.length === 0 && (
                          <p className="text-xs text-slate-400">Hali qo'shilmagan.</p>
                        )}
                        {optionAssignments.map((a) => (
                          <AssignmentChip key={a.id} assignment={a} onRemove={removeAssignment} removing={busy === a.id} />
                        ))}
                      </div>
                      <IndicatorPicker
                        pool={pool}
                        excludeIds={attachedIndicatorIds}
                        adding={busy}
                        onAdd={(indicatorId) => addIndicator(opt.id, indicatorId)}
                      />
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
            <input
              className="input-field"
              placeholder="Savol (UZ)"
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
            <input
              type="number"
              className="input-field"
              placeholder="Tartib"
              value={questionModal.data.order}
              onChange={(e) => setQuestionModal({ ...questionModal, data: { ...questionModal.data, order: e.target.value } })}
            />
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
            <input
              type="number"
              className="input-field"
              placeholder="Tartib"
              value={optionModal.data.order}
              onChange={(e) => setOptionModal({ ...optionModal, data: { ...optionModal.data, order: e.target.value } })}
            />
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
    </div>
  );
}
