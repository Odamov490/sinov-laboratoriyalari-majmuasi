import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, FileCheck2 } from 'lucide-react';

export default function Hero() {
  const { t } = useTranslation();
  return (
    <section className="relative overflow-hidden bg-primary">
      <div
        className="absolute inset-0 opacity-25 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1581093458791-9d42e3f0b7d6?q=80&w=2000&auto=format&fit=crop')",
        }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/90 via-primary/85 to-primary" />
      <div className="relative container-page py-24 md:py-32 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-accent mb-6 border border-white/10">
          <FileCheck2 className="h-3.5 w-3.5" />
          O‘z DSt ISO/IEC 17025:2019
        </span>
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-tight">
          {t('hero.title')}
        </h1>
        <p className="mt-6 text-base md:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
          {t('hero.tagline')}
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
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
      </div>
    </section>
  );
}
