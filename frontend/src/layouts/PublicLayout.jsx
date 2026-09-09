import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import TestModeBanner from '../components/TestModeBanner.jsx';

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
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
