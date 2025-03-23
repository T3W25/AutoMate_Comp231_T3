// backend/routes/mechanicRoutes.js
const express = require('express');
const router = express.Router();
const {
  updateMechanicProfile,
  getMechanics,
  getMechanicById,
} = require('../controllers/mechanicController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(getMechanics);

router.route('/profile')
  .post(protect, updateMechanicProfile);

router.route('/:id')
  .get(getMechanicById);

module.exports = router;