const express = require('express');
const router = express.Router();
const {
  getUsers,
  updateUserStatus,
  deleteUser,
  getSystemStats,
  sendNotification
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Apply admin authorization to all routes
router.use(protect, authorize(['admin']));

// User management routes
router.get('/users', getUsers);
router.put('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

// System stats routes
router.get('/stats', getSystemStats);

// Notification routes
router.post('/notifications', sendNotification);

module.exports = router;