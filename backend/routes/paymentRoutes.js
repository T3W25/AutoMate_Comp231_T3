// backend/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const { createPayment, getPaymentMethods } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createPayment);
router.get('/methods', protect, getPaymentMethods);

module.exports = router;