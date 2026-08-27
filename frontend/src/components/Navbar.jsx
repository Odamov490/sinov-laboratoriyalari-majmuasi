import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, FlaskConical, ChevronDown, Search } from 'lucide-react';
import SearchOverlay from './SearchOverlay.jsx';

const LANGS = [
  { code: 'uz', label: "O‘zbek" },
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
];

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { to: '/', label: t('nav.home') },
    { to: '/biz-haqimizda', label: t('nav.about') },
    { to: '/laboratoriyalar', label: t('nav.laboratories') },
    { to: '/xizmatlar', label: t('nav.services') },
    { to: '/narxlar', label: t('nav.prices') },
    { to: '/akkreditatsiya', label: t('nav.accreditation') },
    { to: '/yangiliklar', label: t('nav.news') },
    { to: '/hujjatlar', label: t('nav.documents') },
    { to: '/aloqa', label: t('nav.contact') },
  ];

  const navLinkClass = ({ isActive }) =>
    `relative text-sm font-medium whitespace-nowrap px-3 py-2 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
      isActive
        ? 'text-white bg-primary shadow-md'
        : 'text-slate-600 hover:text-primary hover:bg-bg-light'
    }`;

  return (
    <header
      className={`sticky top-0 z-50 bg-white border-b-2 transition-shadow ${
        scrolled ? 'border-primary/20 shadow-lg' : 'border-primary/10 shadow-sm'
      }`}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
            <FlaskConical className="h-5 w-5" />
          </span>
          <span className="font-bold text-primary leading-tight text-sm sm:text-base">
            SLM
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} className={navLinkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <button
            onClick={() => setSearchOpen(true)}
            aria-label={t('common.search')}
            className="p-2 rounded-lg text-slate-500 hover:bg-bg-light hover:text-primary hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 focus-ring"
          >
            <Search className="h-5 w-5" />
          </button>

          <div className="relative">
            <button
              onClick={() => setLangOpen((v) => !v)}
              className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-primary hover:bg-bg-light hover:-translate-y-0.5 hover:shadow-md px-2 py-1.5 rounded-lg transition-all duration-200 focus-ring"
            >
              {LANGS.find((l) => l.code === i18n.language)?.label || 'O‘zbek'}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-2 w-32 rounded-lg border border-border bg-white shadow-card py-1">
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      i18n.changeLanguage(l.code);
                      setLangOpen(false);
                    }}
                    className="block w-full text-left px-3 py-1.5 text-sm text-slate-600 hover:bg-bg-light"
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/ariza"
            className="btn-primary !py-2.5 !px-4 text-sm hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
          >
            {t('nav.apply')}
          </Link>
        </div>

        <button
          className="lg:hidden p-2 text-slate-600 focus-ring rounded-lg"
          onClick={() => setOpen((v) => !v)}
          aria-label="menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-white">
          <div className="container-page py-4 flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2.5 text-sm font-medium ${
                    isActive ? 'bg-bg-light text-primary' : 'text-slate-600'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <Link
              to="/arizani-tekshirish"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600"
            >
              {t('nav.track')}
            </Link>
            <div className="flex gap-2 pt-2">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => i18n.changeLanguage(l.code)}
                  className={`text-xs font-medium px-2.5 py-1.5 rounded-full border ${
                    i18n.language === l.code ? 'border-primary text-primary' : 'border-border text-slate-500'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <Link to="/ariza" onClick={() => setOpen(false)} className="btn-primary mt-3 w-full">
              {t('nav.apply')}
            </Link>
          </div>
        </div>
      )}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}