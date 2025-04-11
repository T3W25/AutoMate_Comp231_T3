const User = require('../models/userModel');
const Vehicle = require('../models/vehicleModel');
const Booking = require('../models/bookingModel');
const MechanicService = require('../models/mechanicServiceModel');

// Get all system users with pagination
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const users = await User.find({})
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await User.countDocuments();
    
    res.json({
      users,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user status (suspend/activate)
const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.isActive = isActive;
    await user.save();
    
    res.json({
      message: `User ${isActive ? 'activated' : 'suspended'} successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a user
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await User.deleteOne({ _id: user._id });
    
    res.json({ message: 'User removed successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get system statistics
const getSystemStats = async (req, res) => {
  try {
    // Get counts for different entities
    const userCount = await User.countDocuments();
    const vehicleCount = await Vehicle.countDocuments();
    const bookingCount = await Booking.countDocuments();
    const serviceCount = await MechanicService.countDocuments();
    
    // Get user counts by role
    const renterCount = await User.countDocuments({ role: 'renter' });
    const carOwnerCount = await User.countDocuments({ role: 'carOwner' });
    const mechanicCount = await User.countDocuments({ role: 'mechanic' });
    
    // Get recent users
    const recentUsers = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Get recent bookings
    const recentBookings = await Booking.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('vehicle', 'make model year')
      .populate('renter', 'name email');
    
    res.json({
      counts: {
        users: userCount,
        vehicles: vehicleCount,
        bookings: bookingCount,
        services: serviceCount,
        renters: renterCount,
        carOwners: carOwnerCount,
        mechanics: mechanicCount
      },
      recentUsers,
      recentBookings
    });
  } catch (error) {
    console.error('Error getting system stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send system notification
const sendNotification = async (req, res) => {
  try {
    const { title, message, targetRole, targetUsers } = req.body;
    
    // Validate required fields
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }
    
    // Prepare query for finding users to notify
    let query = {};
    
    // If targeting specific role
    if (targetRole && targetRole !== 'all') {
      query.role = targetRole;
    }
    
    // If targeting specific users
    if (targetUsers && targetUsers.length > 0) {
      query._id = { $in: targetUsers };
    }
    
    // Find users to notify
    const users = await User.find(query).select('_id');
    
    
    res.status(201).json({
      message: `Notification sent to ${users.length} users`,
      targetUsers: users.map(user => user._id)
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getUsers,
  updateUserStatus,
  deleteUser,
  getSystemStats,
  sendNotification
};