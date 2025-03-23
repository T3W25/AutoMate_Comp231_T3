// backend/routes/mechanicServiceRoutes.js
const express = require('express');
const router = express.Router();
const {
  createServiceRequest,
  getServiceRequests,
  getServiceRequestById,
  updateServiceRequestStatus,
} = require('../controllers/mechanicServiceController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createServiceRequest)
  .get(protect, getServiceRequests);

router.route('/:id')
  .get(protect, getServiceRequestById)
  .put(protect, updateServiceRequestStatus);

module.exports = router;