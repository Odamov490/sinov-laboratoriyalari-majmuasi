import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Target, Eye, Heart, FlaskConical } from 'lucide-react';
import { Breadcrumb } from '../components/UI.jsx';
import { LaboratoryCard, StaffCard } from '../components/Cards.jsx';
import { CardSkeleton } from '../components/StateViews.jsx';
import { getLaboratories, getStaff } from '../services/publicApi';

export default function About() {
  const { t } = useTranslation();
  const [labs, setLabs] = useState(null);
  const [staff, setStaff] = useState(null);

  useEffect(() => {
    getLaboratories().then(setLabs).catch(() => setLabs([]));
    getStaff().then((d) => setStaff(d.slice(0, 4))).catch(() => setStaff([]));
  }, []);

  const timeline = [
    { year: '2019', text: "O'z DSt ISO/IEC 17025:2019 standarti asosida akkreditatsiyadan o'tish" },
    { year: '2020+', text: 'Yangi sinov yo‘nalishlari va zamonaviy uskunalar bilan jihozlanish' },
    { year: 'Bugun', text: '8 ta ixtisoslashgan laboratoriya orqali keng qamrovli sinov xizmatlari' },
  ];

  return (
    <div className="section container-page">
      <Breadcrumb items={[{ label: t('nav.about') }]} />
      <h1 className="mt-4 text-3xl md:text-4xl font-extrabold text-primary">{t('nav.about')}</h1>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <Target className="h-8 w-8 text-primary" />
          <h3 className="mt-4 font-semibold text-ink">Missiya</h3>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Mahsulotlar sifati va xavfsizligini xolis, aniq va ishonchli sinovlar orqali baholash.
          </p>
        </div>
        <div className="card p-6">
          <Eye className="h-8 w-8 text-primary" />
          <h3 className="mt-4 font-semibold text-ink">Maqsad</h3>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Xalqaro standartlarga mos, texnik jihatdan malakali sinov infratuzilmasini rivojlantirish.
          </p>
        </div>
        <div className="card p-6">
          <Heart className="h-8 w-8 text-primary" />
          <h3 className="mt-4 font-semibold text-ink">Qadriyatlar</h3>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Xolislik, aniqlik, professionallik va mijozlarga ishonchli xizmat ko‘rsatish.
          </p>
        </div>
      </div>

      <div className="mt-16">
        <h2 className="section-title">Tarix</h2>
        <div className="mt-8 space-y-6 border-l-2 border-border pl-6">
          {timeline.map((item) => (
            <div key={item.year} className="relative">
              <span className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full bg-accent border-2 border-white ring-2 ring-primary" />
              <p className="text-sm font-bold text-primary">{item.year}</p>
              <p className="mt-1 text-sm text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-16">
        <h2 className="section-title">{t('nav.laboratories')}</h2>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {labs === null
            ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
            : labs.map((l) => <LaboratoryCard key={l.id} lab={l} />)}
        </div>
      </div>

      {staff && staff.length > 0 && (
        <div className="mt-16">
          <h2 className="section-title">{t('nav.staff')}</h2>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {staff.map((s) => (
              <StaffCard key={s.id} person={s} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-16 flex items-center gap-3 text-primary">
        <FlaskConical className="h-5 w-5" />
        <p className="text-sm font-medium">O‘z DSt ISO/IEC 17025:2019</p>
      </div>
    </div>
  );
}
