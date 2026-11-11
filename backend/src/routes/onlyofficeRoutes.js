const express = require('express');
const { callback } = require('../controllers/onlyofficeController');

// OnlyOffice Document Server'dan keladigan callback (cookie yo'q, JWT bilan tekshiriladi).
const router = express.Router();
router.post('/callback/:formId', callback);

module.exports = router;
