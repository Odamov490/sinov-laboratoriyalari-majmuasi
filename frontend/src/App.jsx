import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

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
import TnVedCheck from './pages/TnVedCheck.jsx';
import MxikCheck from './pages/MxikCheck.jsx';
import DeclarationInfo from './pages/DeclarationInfo.jsx';
import TrackApplication from './pages/TrackApplication.jsx';
import Products from './pages/Products.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import NotFound from './pages/NotFound.jsx';

import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminApplications from './pages/admin/AdminApplications.jsx';
import AdminPrices from './pages/admin/AdminPrices.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminSettings from './pages/admin/AdminSettings.jsx';
import AdminDeclarationInfo from './pages/admin/AdminDeclarationInfo.jsx';
import AdminCrudPage from './pages/admin/AdminCrudPage.jsx';
import AdminSmkPage, { AdminSmkLegacyRedirect } from './pages/admin/AdminSmkPage.jsx';
import AdminReports from './pages/admin/reports/AdminReports.jsx';
import AdminSamples from './pages/admin/AdminSamples.jsx';
import AdminSampleDetail from './pages/admin/AdminSampleDetail.jsx';
import AdminScanner from './pages/admin/AdminScanner.jsx';
import AdminProfile from './pages/admin/AdminProfile.jsx';
import AdminTasks from './pages/admin/AdminTasks.jsx';
import AdminTestProgramBuilder from './pages/admin/AdminTestProgramBuilder.jsx';
import { Loading } from './components/StateViews.jsx';
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
  contactMessageConfig,
  tnVedRegulationConfig,
  testIndicatorConfig,
  productConfig,
  nonConformanceConfig,
  complaintConfig,
  smkDocumentConfig,
  internalAuditConfig,
  calibrationRecordConfig,
  trainingRecordConfig,
  qualityControlRecordConfig,
  proficiencyTestConfig,
  measurementUncertaintyConfig,
  riskItemConfig,
} from './pages/admin/adminConfigs.js';

import AdminSifat from './pages/admin/AdminSifat.jsx';

// Chat alohida bo'lak (chunk) bo'lib, faqat ochilganda yuklanadi.
const AdminChat = lazy(() => import('./pages/admin/chat/AdminChat.jsx'));

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
        <Route path="/tnved-tekshirish" element={<TnVedCheck />} />
        <Route path="/mxik-tekshirish" element={<MxikCheck />} />
        <Route path="/deklaratsiya-va-sertifikat" element={<DeclarationInfo />} />
        <Route path="/mahsulotlar" element={<Products />} />
        <Route path="/mahsulotlar/:slug" element={<ProductDetail />} />
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
        <Route path="sifat" element={<AdminSifat />} />
        <Route path="murojaatlar" element={<AdminCrudPage config={contactMessageConfig} />} />
        <Route path="tnved-reglament" element={<AdminCrudPage config={tnVedRegulationConfig} />} />
        <Route path="korsatkichlar" element={<AdminCrudPage config={testIndicatorConfig} />} />
        <Route path="sinov-dasturlari" element={<AdminCrudPage config={productConfig} />} />
        <Route path="sinov-dasturlari/:id" element={<AdminTestProgramBuilder />} />
        <Route path="deklaratsiya-sertifikat" element={<AdminDeclarationInfo />} />
        <Route path="smk/:labSlug/nomuvofiqliklar" element={<AdminSmkPage config={nonConformanceConfig} />} />
        <Route path="smk/:labSlug/shikoyatlar" element={<AdminSmkPage config={complaintConfig} />} />
        <Route path="smk/:labSlug/hujjatlar" element={<AdminSmkPage config={smkDocumentConfig} />} />
        <Route path="smk/:labSlug/auditlar" element={<AdminSmkPage config={internalAuditConfig} />} />
        <Route path="smk/:labSlug/kalibrlash" element={<AdminSmkPage config={calibrationRecordConfig} />} />
        <Route path="smk/:labSlug/treninglar" element={<AdminSmkPage config={trainingRecordConfig} />} />
        <Route path="smk/:labSlug/qc" element={<AdminSmkPage config={qualityControlRecordConfig} />} />
        <Route path="smk/:labSlug/malakaviy-sinovlar" element={<AdminSmkPage config={proficiencyTestConfig} />} />
        <Route path="smk/:labSlug/olchov-noaniqligi" element={<AdminSmkPage config={measurementUncertaintyConfig} />} />
        <Route path="smk/:labSlug/risklar" element={<AdminSmkPage config={riskItemConfig} />} />
        <Route path="smk/:module" element={<AdminSmkLegacyRedirect />} />
        <Route path="namunalar" element={<AdminSamples />} />
         <Route path="namunalar/:id" element={<AdminSampleDetail />} />
        <Route path="hisobot" element={<AdminReports />} />
        <Route path="skanerlash" element={<AdminScanner />} />
        <Route path="foydalanuvchilar" element={<AdminUsers />} />
        <Route path="mening-profilim" element={<AdminProfile />} />
        <Route path="vazifalar" element={<AdminTasks />} />
        <Route
          path="chat"
          element={
            <Suspense fallback={<Loading />}>
              <AdminChat />
            </Suspense>
          }
        />
        {/* Eski manzillar: endi Sozlamalar ichidagi yorliqlar. */}
        <Route path="stikerlar" element={<Navigate to="/admin/sozlamalar?tab=stikerlar" replace />} />
        <Route path="chat-sozlamalari" element={<Navigate to="/admin/sozlamalar?tab=chat" replace />} />
        <Route path="sozlamalar" element={<AdminSettings />} />
      </Route>
    </Routes>
  );
}
