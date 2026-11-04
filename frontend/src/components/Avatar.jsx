import React, { useState } from 'react';

// Foydalanuvchi rasmi yoki ism bosh harflari (rang ID/ismdan deterministik).
const COLORS = ['bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500', 'bg-teal-500', 'bg-indigo-500', 'bg-orange-500'];

export const initialsOf = (name) =>
  (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

export const colorOf = (seed) => COLORS[[...(seed || '')].reduce((s, c) => s + c.charCodeAt(0), 0) % COLORS.length];

const SIZES = { xs: 'h-6 w-6 text-[10px]', sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-16 w-16 text-xl', xl: 'h-28 w-28 text-3xl' };

export default function Avatar({ name, src, seed, size = 'sm', className = '' }) {
  const [broken, setBroken] = useState(false);
  const cls = `${SIZES[size] || size} shrink-0 rounded-full ${className}`;
  if (src && !broken) {
    return <img src={src} alt={name || ''} className={`${cls} object-cover`} onError={() => setBroken(true)} />;
  }
  return (
    <span className={`${cls} inline-flex items-center justify-center font-semibold text-white ${colorOf(seed || name)}`} aria-hidden={!name}>
      {initialsOf(name)}
    </span>
  );
}
