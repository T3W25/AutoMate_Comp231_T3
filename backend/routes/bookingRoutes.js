const express = require('express');
const router = express.Router();
const { 
  createBooking, 
  getUserBookings, 
  getBookingById, 
  updateBookingStatus 
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createBooking)
  .get(protect, getUserBookings);

router.route('/:id')
  .get(protect, getBookingById)
  .put(protect, updateBookingStatus);

module.exports = router;