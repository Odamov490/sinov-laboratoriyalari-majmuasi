import React from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4">
      <div className={`w-full ${sizes[size]} rounded-xl bg-white shadow-2xl border border-border max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-semibold text-ink">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 focus-ring rounded">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message }) {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={title || t('common.delete')} size="sm">
      <p className="text-sm text-slate-600">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} className="btn-secondary">
          {t('common.cancel')}
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700"
        >
          {t('common.delete')}
        </button>
      </div>
    </Modal>
  );
}
