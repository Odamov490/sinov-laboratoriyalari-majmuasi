import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, FileCheck2 } from 'lucide-react';

const NODES = [
  [80, 90], [220, 180], [150, 320], [340, 80], [420, 250], [380, 420],
  [560, 140], [600, 380], [720, 60], [760, 300], [860, 180], [900, 450],
  [980, 80], [1020, 320], [1100, 200], [1140, 420], [300, 480], [500, 520],
  [700, 500], [900, 520], [60, 450], [1150, 60],
];

const EDGES = [
  [0, 1], [1, 2], [1, 3], [3, 4], [4, 5], [4, 6], [6, 8], [6, 7], [7, 9],
  [8, 10], [10, 9], [10, 12], [11, 9], [11, 13], [13, 14], [14, 15], [14, 21],
  [2, 16], [16, 17], [17, 18], [18, 19], [5, 17], [20, 2], [19, 11],
];

const ACCENT_NODES = new Set([3, 8, 13, 17]);

// slides: fon rasmlari (admin -> Sozlamalar); bo'sh bo'lsa — avvalgi naqshli fon.
export default function Hero({ slides = [], interval = 6 }) {
  const { t } = useTranslation();
  const sectionRef = useRef(null);
  const [bgOffset, setBgOffset] = useState(0);
  const [slide, setSlide] = useState({ current: 0, prev: null, animated: false });
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  const goTo = (next) =>
    setSlide((s) => (next === s.current ? s : { current: next, prev: s.current, animated: true }));

  // Avtomatik almashinish; sichqoncha ustida yoki tab yashirin bo'lsa — to'xtaydi.
  useEffect(() => {
    if (count < 2 || paused) return undefined;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      setSlide((s) => ({ current: (s.current + 1) % count, prev: s.current, animated: true }));
    }, Math.max(3, interval) * 1000);
    return () => window.clearInterval(id);
  }, [count, interval, paused, slide.current]);

  useEffect(() => {
    if (slide.current >= count && count) setSlide({ current: 0, prev: null, animated: false });
  }, [count, slide.current]);

  useEffect(() => {
    if (window.innerWidth < 768) return undefined;

    let ticking = false;
    const update = () => {
      ticking = false;
      const section = sectionRef.current;
      if (!section) return;
      const heroHeight = section.offsetHeight;
      const scrollY = window.scrollY;
      if (scrollY > heroHeight) return;
      setBgOffset(scrollY * 0.35);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-primary"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {count > 0 && (
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ transform: `translateY(${bgOffset}px)` }}
          aria-hidden="true"
        >
          {slides.map((src, i) => {
            const active = i === slide.current;
            const leaving = i === slide.prev && !active;
            return (
              <img
                key={`${src}-${i}`}
                src={src}
                alt=""
                decoding="async"
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchpriority={i === 0 ? 'high' : 'low'}
                onAnimationEnd={leaving ? () => setSlide((s) => (s.prev === i ? { ...s, prev: null } : s)) : undefined}
                className={`hero-slide absolute inset-0 h-full w-full object-cover ${active ? 'is-active' : ''} ${
                  active && slide.animated ? 'is-animated' : ''
                } ${leaving ? 'is-leaving' : ''}`}
              />
            );
          })}
        </div>
      )}
      <div
        className={`absolute inset-0 hero-gradient-bg ${count > 0 ? 'hidden' : ''}`}
        style={{ transform: `translateY(${bgOffset}px)` }}
        aria-hidden="true"
      >
        <svg
          className="absolute inset-0 h-full w-full hero-mesh"
          viewBox="0 0 1200 600"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <g stroke="#ffffff" strokeWidth="1" opacity="0.5">
            {EDGES.map(([a, b], i) => {
              const [x1, y1] = NODES[a];
              const [x2, y2] = NODES[b];
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
            })}
          </g>
          {NODES.map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={ACCENT_NODES.has(i) ? 5 : 3}
              fill={ACCENT_NODES.has(i) ? '#D9A441' : '#ffffff'}
            />
          ))}
        </svg>
      </div>
      <div
        className={`absolute inset-0 bg-gradient-to-b ${
          count > 0 ? 'from-primary/80 via-primary/60 to-primary/90' : 'from-primary/60 via-primary/50 to-primary'
        }`}
      />

      <div className="relative container-page py-24 md:py-32 text-center">
        <span
          className="hero-fade-up inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-accent mb-6 border border-white/10"
          style={{ animationDelay: '0ms' }}
        >
          <FileCheck2 className="h-3.5 w-3.5" />
          O‘z DSt ISO/IEC 17025:2019
        </span>
        <h1
          className="hero-fade-up text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-tight"
          style={{ animationDelay: '130ms' }}
        >
          {t('hero.title')}
        </h1>
        <p
          className="hero-fade-up mt-6 text-base md:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed"
          style={{ animationDelay: '260ms' }}
        >
          {t('hero.tagline')}
        </p>
        <div
          className="hero-fade-up mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          style={{ animationDelay: '390ms' }}
        >
          <Link to="/xizmatlar" className="btn-accent w-full sm:w-auto">
            {t('hero.cta1')}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/ariza"
            className="btn-secondary w-full sm:w-auto !border-white/30 !text-white hover:!bg-white/10"
          >
            {t('hero.cta2')}
          </Link>
        </div>
        <Link
          to="/tnved-tekshirish"
          className="hero-fade-up mt-5 inline-block text-sm font-medium text-white/70 hover:text-white underline underline-offset-2"
          style={{ animationDelay: '520ms' }}
        >
          {t('nav.tnvedCheck')}
        </Link>
      </div>

      {count > 1 && (
        <div className="absolute bottom-5 left-0 right-0 z-10 flex justify-center gap-2">
          {slides.map((src, i) => (
            <button
              key={`dot-${src}-${i}`}
              type="button"
              onClick={() => goTo(i)}
              aria-label={t('hero.slide', { n: i + 1 })}
              aria-current={i === slide.current ? 'true' : undefined}
              className={`h-1.5 rounded-full transition-all ${
                i === slide.current ? 'w-6 bg-accent' : 'w-1.5 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
