import React from 'react';
import { STATUS_LABELS, STATUS_STYLES } from './sampleConstants';

export default function SampleStatusBadge({ status, className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
        STATUS_STYLES[status] || 'bg-slate-50 text-slate-600 border-slate-200'
      } ${className}`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}
