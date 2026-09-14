import React from 'react';

// Small hand-drawn SVG mockups for each of the 10 "Ariza qanday beriladi?"
// guide steps. Deliberately abstract (not a pixel copy of tris.uz's actual
// UI, which belongs to a different organization) — just enough shape
// language (dropdowns, checkboxes, tables, buttons) to give each step a
// visual anchor, in the site's own primary/accent palette.

const NAVY = '#0B3A63';
const GOLD = '#D9A441';
const LINE = '#E2E8F0';
const PALE = '#F5F8FB';
const INK = '#17212B';
const EMERALD = '#10B981';

const Frame = ({ children }) => (
  <svg viewBox="0 0 160 100" className="w-full h-full" role="img" aria-hidden="true">
    <rect x="1" y="1" width="158" height="98" rx="10" fill="#fff" stroke={LINE} strokeWidth="1.5" />
    {children}
  </svg>
);

const Chevron = ({ x, y, color = NAVY }) => (
  <path d={`M${x} ${y} l5 5 l5 -5`} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
);

const Check = ({ x, y, color = '#fff', size = 8 }) => (
  <path
    d={`M${x} ${y + size * 0.5} l${size * 0.35} ${size * 0.35} l${size * 0.65} -${size * 0.7}`}
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    fill="none"
  />
);

const STEPS = {
  1: () => (
    <Frame>
      <text x="16" y="24" fontSize="8" fill="#94A3B8" fontFamily="sans-serif">Foydalanuvchi turi</text>
      <rect x="16" y="32" width="128" height="26" rx="7" fill={PALE} stroke={NAVY} strokeWidth="1.5" />
      <circle cx="30" cy="45" r="7" fill={NAVY} />
      <Check x={26.5} y={40.5} size={7} />
      <text x="42" y="49" fontSize="9" fill={INK} fontFamily="sans-serif" fontWeight="600">Yuridik shaxs</text>
      <Chevron x={126} y={40} />
    </Frame>
  ),
  2: () => (
    <Frame>
      <rect x="16" y="16" width="14" height="14" rx="3" fill={NAVY} />
      <Check x={19} y={19.5} size={7} />
      <rect x="36" y="20" width="100" height="6" rx="3" fill={LINE} />
      <rect x="16" y="38" width="14" height="14" rx="3" fill={NAVY} />
      <Check x={19} y={41.5} size={7} />
      <rect x="36" y="42" width="90" height="6" rx="3" fill={LINE} />
      <rect x="16" y="64" width="128" height="18" rx="5" fill={PALE} stroke={LINE} />
      <rect x="22" y="70" width="60" height="6" rx="3" fill="#CBD5E1" />
    </Frame>
  ),
  3: () => (
    <Frame>
      <circle cx="140" cy="18" r="11" fill={GOLD} />
      <path d="M140 13v10M135 18h10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <rect x="16" y="34" width="112" height="10" rx="2" fill={PALE} />
      <rect x="16" y="48" width="112" height="12" rx="2" fill="#fff" stroke={LINE} />
      <rect x="16" y="64" width="112" height="12" rx="2" fill="#fff" stroke={LINE} />
      <rect x="22" y="52" width="40" height="4" rx="2" fill="#CBD5E1" />
      <rect x="22" y="68" width="40" height="4" rx="2" fill="#CBD5E1" />
    </Frame>
  ),
  4: () => (
    <Frame>
      <rect x="30" y="14" width="100" height="42" rx="8" fill={PALE} stroke={LINE} strokeDasharray="4 3" />
      <path d="M80 26v16M73 34l7-9l7 9" stroke={NAVY} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="45" y="66" width="70" height="20" rx="6" fill={NAVY} />
      <text x="80" y="79" fontSize="9" fill="#fff" fontFamily="sans-serif" fontWeight="700" textAnchor="middle">Yaratish</text>
    </Frame>
  ),
  5: () => (
    <Frame>
      <rect x="14" y="16" width="60" height="16" rx="4" fill={PALE} stroke={LINE} />
      <text x="44" y="27" fontSize="7" fill="#94A3B8" fontFamily="sans-serif" textAnchor="middle">Ariza</text>
      <path d="M78 24h14" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" markerEnd="url(#arrow5)" />
      <defs>
        <marker id="arrow5" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#94A3B8" />
        </marker>
      </defs>
      <rect x="96" y="14" width="50" height="20" rx="5" fill={NAVY} />
      <text x="121" y="27" fontSize="7" fill="#fff" fontFamily="sans-serif" fontWeight="700" textAnchor="middle">Sinovlar</text>
      <rect x="16" y="50" width="128" height="34" rx="6" fill={PALE} />
      <rect x="24" y="58" width="80" height="6" rx="3" fill="#CBD5E1" />
      <rect x="24" y="70" width="50" height="6" rx="3" fill="#CBD5E1" />
    </Frame>
  ),
  6: () => (
    <Frame>
      <rect x="16" y="18" width="128" height="24" rx="6" fill={PALE} stroke={LINE} />
      <text x="24" y="33" fontSize="8" fill={INK} fontFamily="sans-serif" fontWeight="600">Mahsulot A</text>
      <rect x="30" y="56" width="100" height="24" rx="12" fill="#fff" stroke={NAVY} strokeWidth="1.5" />
      <path d="M50 68h10M55 63v10" stroke={NAVY} strokeWidth="2" strokeLinecap="round" />
      <text x="90" y="72" fontSize="8" fill={NAVY} fontFamily="sans-serif" fontWeight="700" textAnchor="middle">Laboratoriya</text>
    </Frame>
  ),
  7: () => (
    <Frame>
      <rect x="16" y="14" width="128" height="18" rx="5" fill="#fff" stroke={NAVY} strokeWidth="1.5" />
      <circle cx="26" cy="23" r="3.2" fill="none" stroke="#94A3B8" strokeWidth="1.6" />
      <path d="M28.3 25.3l2.2 2.2" stroke="#94A3B8" strokeWidth="1.6" strokeLinecap="round" />
      <text x="36" y="26" fontSize="8" fill="#64748B" fontFamily="sans-serif">0309</text>
      <rect x="16" y="36" width="128" height="14" fill="#fff" stroke={LINE} />
      <rect x="16" y="50" width="128" height="16" fill={GOLD} fillOpacity="0.18" stroke={GOLD} />
      <text x="22" y="61" fontSize="7.5" fill={NAVY} fontFamily="sans-serif" fontWeight="700">O'ZAK.SL.0309</text>
      <rect x="16" y="66" width="128" height="14" fill="#fff" stroke={LINE} />
    </Frame>
  ),
  8: () => (
    <Frame>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(16, ${14 + i * 24})`}>
          <rect width="60" height="5" rx="2.5" fill="#CBD5E1" />
          <rect y="9" width="128" height="12" rx="4" fill={PALE} stroke={LINE} />
        </g>
      ))}
    </Frame>
  ),
  9: () => (
    <Frame>
      <rect x="0" y="0" width="160" height="100" rx="10" fill="#0B3A63" fillOpacity="0.05" />
      <rect x="20" y="18" width="120" height="62" rx="10" fill="#fff" stroke={LINE} strokeWidth="1.5" />
      <circle cx="80" cy="38" r="10" fill={NAVY} />
      <text x="80" y="42" fontSize="12" fill="#fff" fontFamily="sans-serif" fontWeight="700" textAnchor="middle">!</text>
      <rect x="34" y="54" width="92" height="6" rx="3" fill={LINE} />
      <rect x="44" y="64" width="72" height="6" rx="3" fill={LINE} />
      <rect x="32" y="78" width="40" height="14" rx="5" fill="#fff" stroke={LINE} />
      <rect x="88" y="78" width="40" height="14" rx="5" fill={NAVY} />
    </Frame>
  ),
  10: () => (
    <Frame>
      <rect x="16" y="16" width="128" height="18" rx="5" fill={PALE} />
      <rect x="22" y="21" width="50" height="6" rx="3" fill="#CBD5E1" />
      <rect x="110" y="20" width="30" height="10" rx="5" fill={EMERALD} fillOpacity="0.15" stroke={EMERALD} />
      <text x="125" y="27.5" fontSize="6.5" fill={EMERALD} fontFamily="sans-serif" fontWeight="700" textAnchor="middle">Yangi</text>
      <rect x="16" y="40" width="128" height="18" rx="5" fill="#fff" stroke={LINE} />
      <rect x="22" y="45" width="50" height="6" rx="3" fill="#E2E8F0" />
      <circle cx="128" cy="49" r="9" fill={EMERALD} />
      <Check x={124.5} y={45.5} size={7} />
      <text x="16" y="74" fontSize="7.5" fill="#94A3B8" fontFamily="sans-serif">O'ZAK.SL.0309</text>
    </Frame>
  ),
};

export default function GuideStepIllustration({ step, className = '' }) {
  const Illustration = STEPS[step];
  if (!Illustration) return null;
  return (
    <div className={`rounded-lg overflow-hidden bg-bg-light border border-border ${className}`}>
      <Illustration />
    </div>
  );
}
