// backend/routes/locationRoutes.js
const express = require('express');
const router = express.Router();
const { updateLocation, getMechanicLocation } = require('../controllers/locationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/update', protect, updateLocation);
router.get('/mechanic/:id', protect, getMechanicLocation);

module.exports = router;