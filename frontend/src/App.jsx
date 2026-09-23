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
import TnVedCheck from './pages/TnVedCheck.jsx';
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
import AdminSamples from './pages/admin/AdminSamples.jsx';
import AdminSampleDetail from './pages/admin/AdminSampleDetail.jsx';
import AdminScanner from './pages/admin/AdminScanner.jsx';
import AdminProfile from './pages/admin/AdminProfile.jsx';
import AdminTestProgramBuilder from './pages/admin/AdminTestProgramBuilder.jsx';
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
  smkDocumentVersionConfig,
  internalAuditConfig,
  auditFindingConfig,
  calibrationRecordConfig,
  trainingRecordConfig,
  qualityControlRecordConfig,
  proficiencyTestConfig,
  measurementUncertaintyConfig,
  methodValidationConfig,
  impartialityDeclarationConfig,
  supplierEvaluationConfig,
  subcontractorConfig,
  environmentLogConfig,
  documentAcknowledgmentConfig,
  managementReviewConfig,
  riskItemConfig,
  qualityObjectiveConfig,
  improvementSuggestionConfig,
  retentionPolicyConfig,
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
        <Route path="/tnved-tekshirish" element={<TnVedCheck />} />
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
        <Route path="murojaatlar" element={<AdminCrudPage config={contactMessageConfig} />} />
        <Route path="tnved-reglament" element={<AdminCrudPage config={tnVedRegulationConfig} />} />
        <Route path="korsatkichlar" element={<AdminCrudPage config={testIndicatorConfig} />} />
        <Route path="sinov-dasturlari" element={<AdminCrudPage config={productConfig} />} />
        <Route path="sinov-dasturlari/:id" element={<AdminTestProgramBuilder />} />
        <Route path="deklaratsiya-sertifikat" element={<AdminDeclarationInfo />} />
        <Route path="smk/nomuvofiqliklar" element={<AdminCrudPage config={nonConformanceConfig} />} />
        <Route path="smk/shikoyatlar" element={<AdminCrudPage config={complaintConfig} />} />
        <Route path="smk/hujjatlar" element={<AdminCrudPage config={smkDocumentConfig} />} />
        <Route path="smk/hujjat-versiyalari" element={<AdminCrudPage config={smkDocumentVersionConfig} />} />
        <Route path="smk/auditlar" element={<AdminCrudPage config={internalAuditConfig} />} />
        <Route path="smk/audit-topilmalari" element={<AdminCrudPage config={auditFindingConfig} />} />
        <Route path="smk/kalibrlash" element={<AdminCrudPage config={calibrationRecordConfig} />} />
        <Route path="smk/treninglar" element={<AdminCrudPage config={trainingRecordConfig} />} />
        <Route path="smk/qc" element={<AdminCrudPage config={qualityControlRecordConfig} />} />
        <Route path="smk/malakaviy-sinovlar" element={<AdminCrudPage config={proficiencyTestConfig} />} />
        <Route path="smk/olchov-noaniqligi" element={<AdminCrudPage config={measurementUncertaintyConfig} />} />
        <Route path="smk/metodika" element={<AdminCrudPage config={methodValidationConfig} />} />
        <Route path="smk/xolislik" element={<AdminCrudPage config={impartialityDeclarationConfig} />} />
        <Route path="smk/taminotchilar" element={<AdminCrudPage config={supplierEvaluationConfig} />} />
        <Route path="smk/subpudratchilar" element={<AdminCrudPage config={subcontractorConfig} />} />
        <Route path="smk/muhit-monitoring" element={<AdminCrudPage config={environmentLogConfig} />} />
        <Route path="smk/tanishtirish" element={<AdminCrudPage config={documentAcknowledgmentConfig} />} />
        <Route path="smk/boshqaruv-sharhi" element={<AdminCrudPage config={managementReviewConfig} />} />
        <Route path="smk/risklar" element={<AdminCrudPage config={riskItemConfig} />} />
        <Route path="smk/maqsadlar" element={<AdminCrudPage config={qualityObjectiveConfig} />} />
        <Route path="smk/takliflar" element={<AdminCrudPage config={improvementSuggestionConfig} />} />
        <Route path="smk/arxiv-siyosati" element={<AdminCrudPage config={retentionPolicyConfig} />} />
        <Route path="namunalar" element={<AdminSamples />} />
         <Route path="namunalar/:id" element={<AdminSampleDetail />} />
        <Route path="skanerlash" element={<AdminScanner />} />
        <Route path="foydalanuvchilar" element={<AdminUsers />} />
        <Route path="mening-profilim" element={<AdminProfile />} />
        <Route path="sozlamalar" element={<AdminSettings />} />
      </Route>
    </Routes>
  );
}
