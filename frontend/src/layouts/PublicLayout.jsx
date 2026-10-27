import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import TestModeBanner from '../components/TestModeBanner.jsx';
import SEO from '../components/SEO.jsx';
import { trackPageView } from '../services/publicApi';

export default function PublicLayout() {
  const { pathname } = useLocation();

  // Counts every public page view, including in-app (SPA) navigation.
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Sitewide fallback meta tags — each page's own <SEO> (rendered
          deeper in the tree) overrides these via react-helmet-async's
          merge order, so every route always has a description even
          before/without a page-specific one (loading states, 404, etc). */}
      <SEO />
      <div className="sticky top-0 z-50">
        <TestModeBanner />
        <Navbar />
      </div>
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
