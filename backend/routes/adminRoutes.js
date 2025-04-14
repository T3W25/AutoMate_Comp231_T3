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

  
router.use(protect, authorize(['admin']));

  
router.get('/users', getUsers);
router.put('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

  
router.get('/stats', getSystemStats);

  
router.post('/notifications', sendNotification);

module.exports = router;