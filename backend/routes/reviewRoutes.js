// backend/routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const {
  createReview,
  getReviews,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createReview);
router.get('/:targetType/:targetId', getReviews);

module.exports = router;