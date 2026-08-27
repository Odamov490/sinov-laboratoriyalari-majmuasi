import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FlaskConical, Phone, Mail, MapPin, Send, Instagram } from 'lucide-react';
import { getSettings } from '../services/publicApi';

export default function Footer() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({});

  useEffect(() => {
    getSettings().then(setSettings).catch(() => {});
  }, []);

  const val = (key, fallback) => settings[key] || fallback;

  const quickLinks = [
    { to: '/laboratoriyalar', label: t('nav.laboratories') },
    { to: '/xizmatlar', label: t('nav.services') },
    { to: '/narxlar', label: t('nav.prices') },
    { to: '/hujjatlar', label: t('nav.documents') },
    { to: '/akkreditatsiya', label: t('nav.accreditation') },
  ];

  return (
    <footer className="bg-primary text-white mt-20">
      <div className="container-page py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
              <FlaskConical className="h-5 w-5 text-accent" />
            </span>
            <span className="font-bold">SLM</span>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">
            {t('hero.title')}
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide text-white/60">
            {t('footer.quickLinks')}
          </h4>
          <ul className="space-y-2">
            {quickLinks.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-sm text-white/80 hover:text-accent transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide text-white/60">
            {t('footer.contactInfo')}
          </h4>
          <ul className="space-y-3 text-sm text-white/80">
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-accent" />
              <span>{val('address') || t('common.dataUpdating')}</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-accent" />
              <span>{val('phone') || t('common.dataUpdating')}</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-accent" />
              <span>{val('email') || t('common.dataUpdating')}</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide text-white/60">Social</h4>
          <div className="flex gap-3">
            {val('telegram') && (
              <a
                href={val('telegram')}
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20"
              >
                <Send className="h-4 w-4" />
              </a>
            )}
            {val('instagram') && (
              <a
                href={val('instagram')}
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20"
              >
                <Instagram className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5">
        <div className="container-page text-center text-xs text-white/50">
          © {new Date().getFullYear()} Sinov Laboratoriyalari Majmuasi. {t('footer.rights')}
        </div>
      </div>
    </footer>
  );
}
