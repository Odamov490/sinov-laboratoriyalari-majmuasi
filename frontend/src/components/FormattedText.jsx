import React from 'react';

/**
 * Renders free-form text (from admin-entered descriptions, content, scope
 * fields, etc.) with sensible formatting:
 * - Blank-line separated blocks become paragraphs.
 * - A block that looks like "1. ... 2. ... 3. ..." (with or without actual
 *   line breaks between items) renders as a numbered list with circular
 *   badges, instead of one run-on paragraph.
 * - Single line breaks within an ordinary paragraph are preserved.
 *
 * Usage: <FormattedText text={someDescriptionField} />
 */
export default function FormattedText({ text, className = '' }) {
  if (!text) return null;

  const blocks = text.split(/\n{2,}/).filter(Boolean);

  return (
    <div className={`space-y-4 text-slate-600 leading-relaxed ${className}`}>
      {blocks.map((block, idx) => {
        const items = block
          .split(/(?=\d+\.\s)/)
          .map((s) => s.trim())
          .filter(Boolean);

        const looksLikeNumberedList = items.length > 1 && items.every((it) => /^\d+\.\s/.test(it));

        if (looksLikeNumberedList) {
          return (
            <ol key={idx} className="space-y-2 list-none">
              {items.map((item, i) => {
                const match = item.match(/^(\d+)\.\s*(.*)$/s);
                const number = match ? match[1] : i + 1;
                const content = match ? match[2] : item;
                return (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {number}
                    </span>
                    <span className="pt-0.5 whitespace-pre-line">{content}</span>
                  </li>
                );
              })}
            </ol>
          );
        }

        return (
          <p key={idx} className="whitespace-pre-line">
            {block}
          </p>
        );
      })}
    </div>
  );
}