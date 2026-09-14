import React from 'react';
import { Info } from 'lucide-react';
import GuideStepIllustration from './GuideStepIllustration.jsx';

// Parses the same "intro paragraph \n\n 1. Title. Description ... 10. Title.
// Description \n\n closing note" text convention used for
// InfoPage.guideContentUz/Ru/En, and renders it as a connected vertical
// step timeline instead of FormattedText's flat numbered list.
function parseGuide(text) {
  if (!text) return { intro: '', steps: [], note: '' };

  const blocks = text.split(/\n{2,}/).filter(Boolean);
  const listBlockIdx = blocks.findIndex((b) => /^\d+\.\s/.test(b));
  if (listBlockIdx === -1) return { intro: text, steps: [], note: '' };

  const intro = blocks.slice(0, listBlockIdx).join('\n\n');
  const note = blocks.slice(listBlockIdx + 1).join('\n\n');

  const items = blocks[listBlockIdx]
    .split(/(?=(?<!\d)\d+\.\s)/)
    .map((s) => s.trim())
    .filter(Boolean);

  const steps = items.map((item) => {
    const match = item.match(/^(\d+)\.\s*([\s\S]*)$/);
    const number = match ? match[1] : '';
    const rest = match ? match[2] : item;
    const titleMatch = rest.match(/^(.+?\.)\s+([\s\S]*)$/);
    return {
      number,
      title: titleMatch ? titleMatch[1] : rest,
      description: titleMatch ? titleMatch[2] : '',
    };
  });

  return { intro, steps, note };
}

export default function GuideTimeline({ text }) {
  const { intro, steps, note } = parseGuide(text);
  if (steps.length === 0) return null;

  return (
    <div>
      {intro && <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{intro}</p>}

      <ol className={`${intro ? 'mt-6' : ''} relative`}>
        {steps.map((step, idx) => (
          <li key={step.number} className="relative flex gap-4 pb-7 last:pb-0">
            {idx < steps.length - 1 && (
              <span className="absolute left-[18px] top-9 bottom-0 w-0.5 bg-border" aria-hidden="true" />
            )}
            <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">
              {step.number}
            </span>
            <div className="pt-1 flex-1 flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink text-sm">{step.title}</p>
                {step.description && (
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed whitespace-pre-line">{step.description}</p>
                )}
              </div>
              <GuideStepIllustration step={Number(step.number)} className="w-full sm:w-36 h-24 shrink-0" />
            </div>
          </li>
        ))}
      </ol>

      {note && (
        <div className="mt-6 flex gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3.5 text-sm text-primary/90 leading-relaxed">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <p className="whitespace-pre-line">{note}</p>
        </div>
      )}
    </div>
  );
}
