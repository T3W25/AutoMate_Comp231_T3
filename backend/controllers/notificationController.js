// backend/controllers/notificationController.js
const User = require('../models/userModel');
const Notification = require('../models/notificationModel'); // You'll need to create this model

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50); // Limit to most recent 50 notifications
    
    res.json(notifications);
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id
// @access  Private
const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Check if notification belongs to user
    if (notification.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this notification' });
    }
    
    notification.isRead = true;
    await notification.save();
    
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a notification (internal function for use by other controllers)
// @access  Private
const createNotification = async (userId, title, message, type, data = {}) => {
  try {
    const notification = new Notification({
      user: userId,
      title,
      message,
      type,
      data,
      isRead: false,
    });
    
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// @desc    Send system-wide notification (admin only)
// @route   POST /api/notifications/system
// @access  Private (admin only)
const sendSystemNotification = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can send system notifications' });
    }
    
    const { title, message, userRole } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ message: 'Please provide title and message' });
    }
    
    // Find users to notify based on userRole (if specified)
    let userQuery = {};
    if (userRole) {
      userQuery.role = userRole;
    }
    
    const users = await User.find(userQuery).select('_id');
    
    // Create notifications for each user
    const notifications = [];
    for (const user of users) {
      const notification = await createNotification(
        user._id,
        title,
        message,
        'system'
      );
      
      if (notification) {
        notifications.push(notification);
      }
    }
    
    res.status(201).json({
      success: true,
      count: notifications.length,
      message: `Sent notification to ${notifications.length} users`
    });
  } catch (error) {
    console.error('Error sending system notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getUserNotifications,
  markNotificationAsRead,
  createNotification,
  sendSystemNotification,
};