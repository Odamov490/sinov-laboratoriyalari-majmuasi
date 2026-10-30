import React from 'react';

/**
 * SLM logotipi: molekula belgisi + "SLM" yozuvi.
 *
 * variant="light"  — oq/och fon uchun (to'q ko'k, saytdagi `primary` rang)
 * variant="dark"   — to'q fon uchun (oq)
 * showText={false} — faqat belgi (tor joy uchun)
 * showTagline      — "Sinov laboratoriyalari majmuasi" yozuvini ham ko'rsatish
 *                    (menyuda joy tejash uchun sukut bo'yicha o'chiq)
 *
 * Oltin tugun saytdagi `accent` rangdan foydalanadi (fill-accent).
 * Agar `accent` Tailwind sozlamasida bo'lmasa, className="fill-accent" o'rniga
 * fill="#E0A92E" yozing.
 */
export default function Logo({ variant = 'light', showText = true, showTagline = false, className = '' }) {
  const isDark = variant === 'dark';
  const color = isDark ? 'text-white' : 'text-primary';
  const tagline = isDark ? 'text-white/70' : 'text-slate-500';

  const svgProps = showText
    ? { 'aria-hidden': true }
    : { role: 'img', 'aria-label': 'SLM' };

  return (
    <span className={`inline-flex items-center gap-3 ${color} ${className}`}>
      <svg width="40" height="40" viewBox="4 4 56 56" className="shrink-0" {...svgProps}>
        <polygon
          points="32,12 49.3,22 49.3,42 32,52 14.7,42 14.7,22"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <circle cx="32" cy="12" r="5.5" fill="currentColor" />
        <circle cx="49.3" cy="22" r="5.5" className="fill-accent" />
        <circle cx="49.3" cy="42" r="5.5" fill="currentColor" />
        <circle cx="32" cy="52" r="5.5" fill="currentColor" />
        <circle cx="14.7" cy="42" r="5.5" fill="currentColor" />
        <circle cx="14.7" cy="22" r="5.5" fill="currentColor" />
      </svg>

      {showText && (
        <>
          <span className="h-9 w-0.5 bg-accent" aria-hidden="true" />
          <span className="flex flex-col leading-none">
            <span className="text-2xl font-extrabold tracking-wide">SLM</span>
            {showTagline && (
              <span className={`mt-1 text-[11px] font-semibold ${tagline}`}>Sinov laboratoriyalari majmuasi</span>
            )}
          </span>
        </>
      )}
    </span>
  );
}
