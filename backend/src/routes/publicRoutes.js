const express = require('express');
const ctrl = require('../controllers/publicController');
const { createApplication, trackApplication, trackByPhone } = require('../controllers/applicationController');
const { createContactMessage } = require('../controllers/contactController');
const { searchTnVed, createTnVedInquiry } = require('../controllers/tnvedController');
const { upload } = require('../middleware/upload');
const { applicationLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.get('/laboratories', ctrl.getLaboratories);
router.get('/laboratories/:slug', ctrl.getLaboratoryBySlug);

router.get('/services', ctrl.getServices);
router.get('/services/:slug', ctrl.getServiceBySlug);

router.get('/prices', ctrl.getPrices);
router.get('/standards', ctrl.getStandards);

router.get('/news', ctrl.getNews);
router.get('/news/:slug', ctrl.getNewsBySlug);

router.get('/documents', ctrl.getDocuments);
router.get('/staff', ctrl.getStaff);

router.get('/equipment', ctrl.getEquipment);
router.get('/equipment/:slug', ctrl.getEquipmentBySlug);

router.get('/gallery', ctrl.getGallery);
router.get('/faq', ctrl.getFaq);
router.get('/accreditation', ctrl.getAccreditation);
router.get('/settings', ctrl.getSettings);
router.get('/search', ctrl.globalSearch);

router.post('/applications', applicationLimiter, upload.array('files', 5), createApplication);
router.get('/applications/track/:applicationNumber', trackApplication);
router.get('/applications/track-by-phone', trackByPhone);

router.post('/contact', createContactMessage);

router.get('/tnved', searchTnVed);
router.post('/tnved/inquiry', createTnVedInquiry);

module.exports = router;
