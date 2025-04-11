// backend/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const {
  getUserNotifications,
  markNotificationAsRead,
  sendSystemNotification,
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, getUserNotifications);
router.put('/:id', protect, markNotificationAsRead);
router.post('/system', protect, authorize(['admin']), sendSystemNotification);

module.exports = router;