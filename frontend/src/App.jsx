import React from 'react';
import { Routes, Route } from 'react-router-dom';

import PublicLayout from './layouts/PublicLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';

import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Laboratories from './pages/Laboratories.jsx';
import LaboratoryDetail from './pages/LaboratoryDetail.jsx';
import Services from './pages/Services.jsx';
import ServiceDetail from './pages/ServiceDetail.jsx';
import Prices from './pages/Prices.jsx';
import Standards from './pages/Standards.jsx';
import Accreditation from './pages/Accreditation.jsx';
import News from './pages/News.jsx';
import NewsDetail from './pages/NewsDetail.jsx';
import Documents from './pages/Documents.jsx';
import Staff from './pages/Staff.jsx';
import Equipment from './pages/Equipment.jsx';
import EquipmentDetail from './pages/EquipmentDetail.jsx';
import Gallery from './pages/Gallery.jsx';
import Faq from './pages/Faq.jsx';
import Contact from './pages/Contact.jsx';
import ApplicationForm from './pages/ApplicationForm.jsx';
import TrackApplication from './pages/TrackApplication.jsx';
import NotFound from './pages/NotFound.jsx';

import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminApplications from './pages/admin/AdminApplications.jsx';
import AdminPrices from './pages/admin/AdminPrices.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminSettings from './pages/admin/AdminSettings.jsx';
import AdminCrudPage from './pages/admin/AdminCrudPage.jsx';
import {
  laboratoryConfig,
  serviceConfig,
  standardConfig,
  newsConfig,
  documentConfig,
  staffConfig,
  equipmentConfig,
  galleryConfig,
  faqConfig,
  accreditationConfig,
} from './pages/admin/adminConfigs.js';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/biz-haqimizda" element={<About />} />
        <Route path="/laboratoriyalar" element={<Laboratories />} />
        <Route path="/laboratoriyalar/:slug" element={<LaboratoryDetail />} />
        <Route path="/xizmatlar" element={<Services />} />
        <Route path="/xizmatlar/:slug" element={<ServiceDetail />} />
        <Route path="/narxlar" element={<Prices />} />
        <Route path="/standartlar" element={<Standards />} />
        <Route path="/akkreditatsiya" element={<Accreditation />} />
        <Route path="/yangiliklar" element={<News />} />
        <Route path="/yangiliklar/:slug" element={<NewsDetail />} />
        <Route path="/hujjatlar" element={<Documents />} />
        <Route path="/mutaxassislar" element={<Staff />} />
        <Route path="/uskunalar" element={<Equipment />} />
        <Route path="/uskunalar/:slug" element={<EquipmentDetail />} />
        <Route path="/galereya" element={<Gallery />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/arizani-tekshirish" element={<TrackApplication />} />
        <Route path="/ariza" element={<ApplicationForm />} />
        <Route path="/aloqa" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="arizalar" element={<AdminApplications />} />
        <Route path="laboratoriyalar" element={<AdminCrudPage config={laboratoryConfig} />} />
        <Route path="xizmatlar" element={<AdminCrudPage config={serviceConfig} />} />
        <Route path="narxlar" element={<AdminPrices />} />
        <Route path="standartlar" element={<AdminCrudPage config={standardConfig} />} />
        <Route path="yangiliklar" element={<AdminCrudPage config={newsConfig} />} />
        <Route path="hujjatlar" element={<AdminCrudPage config={documentConfig} />} />
        <Route path="mutaxassislar" element={<AdminCrudPage config={staffConfig} />} />
        <Route path="uskunalar" element={<AdminCrudPage config={equipmentConfig} />} />
        <Route path="galereya" element={<AdminCrudPage config={galleryConfig} />} />
        <Route path="faq" element={<AdminCrudPage config={faqConfig} />} />
        <Route path="akkreditatsiya" element={<AdminCrudPage config={accreditationConfig} />} />
        <Route path="foydalanuvchilar" element={<AdminUsers />} />
        <Route path="sozlamalar" element={<AdminSettings />} />
      </Route>
    </Routes>
  );
}
