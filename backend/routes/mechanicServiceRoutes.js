// backend/routes/mechanicServiceRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  createServiceRequest,
  getServiceRequests,
  getUserServiceRequests,
  getServiceRequestById,
  updateServiceRequestStatus,
  provideEstimate,
  respondToEstimate,
  completeServiceRequest,
  processServicePayment
} = require('../controllers/mechanicServiceController');
const { protect } = require('../middleware/authMiddleware');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './uploads/service-images'); 
  },
  filename: function(req, file, cb) {
    // Generate a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

router.route('/')
  .post(
    protect, 
    (req, res, next) => {
      console.log('Request received at /mechanic-services');
      console.log('Request body before multer:', req.body);
      next();
    },
    upload.array('images', 5), 
    (req, res, next) => {
      console.log('Files processed by multer:', req.files);
      console.log('Request body after multer:', req.body);
      next();
    }, 
    createServiceRequest
  )
  .get(protect, getServiceRequests);

router.route('/user')
  .get(protect, getUserServiceRequests);

router.route('/:id')
  .get(protect, getServiceRequestById)
  .put(protect, updateServiceRequestStatus);

router.route('/:id/estimate')
  .put(protect, provideEstimate);

router.route('/:id/response')
  .put(protect, respondToEstimate);

router.route('/:id/complete')
  .put(protect, completeServiceRequest);

router.route('/:id/payment')
  .post(protect, processServicePayment);

module.exports = router;