// backend/controllers/mechanicController.js
const User = require('../models/userModel');
const MechanicService = require('../models/mechanicServiceModel');

// @desc    Register as a mechanic or update mechanic profile
// @route   POST /api/mechanics/profile
// @access  Private (mechanics only)
const updateMechanicProfile = async (req, res) => {
  try {
    const {
      serviceName,
      description,
      hourlyRate,
      specialization,
      location,
      coordinates,
      isAvailable,
      workingHours,
      daysAvailable,
    } = req.body;

    // Check if user is a mechanic
    if (req.user.role !== 'mechanic') {
      return res.status(403).json({ message: 'Only mechanics can update mechanic profiles' });
    }

    // Check if mechanic profile already exists
    let mechanicProfile = await MechanicService.findOne({ mechanic: req.user._id });

    if (mechanicProfile) {
      // Update existing profile
      mechanicProfile.serviceName = serviceName || mechanicProfile.serviceName;
      mechanicProfile.description = description || mechanicProfile.description;
      mechanicProfile.hourlyRate = hourlyRate || mechanicProfile.hourlyRate;
      mechanicProfile.specialization = specialization || mechanicProfile.specialization;
      mechanicProfile.location = location || mechanicProfile.location;
      
      if (coordinates) {
        mechanicProfile.coordinates = coordinates;
      }
      
      if (isAvailable !== undefined) {
        mechanicProfile.isAvailable = isAvailable;
      }
      
      if (workingHours) {
        mechanicProfile.workingHours = workingHours;
      }
      
      if (daysAvailable) {
        mechanicProfile.daysAvailable = daysAvailable;
      }

      await mechanicProfile.save();
    } else {
      // Create new profile
      mechanicProfile = await MechanicService.create({
        mechanic: req.user._id,
        serviceName,
        description,
        hourlyRate,
        specialization,
        location,
        coordinates,
        isAvailable,
        workingHours,
        daysAvailable,
      });
    }

    res.json(mechanicProfile);
  } catch (error) {
    console.error('Error updating mechanic profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all mechanics
// @route   GET /api/mechanics
// @access  Public
const getMechanics = async (req, res) => {
  try {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;
    
    // Build filter object based on query parameters
    const filter = {};
    
    if (req.query.specialization) {
      filter.specialization = { $regex: req.query.specialization, $options: 'i' };
    }
    
    if (req.query.location) {
      filter.location = { $regex: req.query.location, $options: 'i' };
    }
    
    if (req.query.minRate && req.query.maxRate) {
      filter.hourlyRate = { 
        $gte: Number(req.query.minRate), 
        $lte: Number(req.query.maxRate) 
      };
    } else if (req.query.minRate) {
      filter.hourlyRate = { $gte: Number(req.query.minRate) };
    } else if (req.query.maxRate) {
      filter.hourlyRate = { $lte: Number(req.query.maxRate) };
    }
    
    // Only show available mechanics by default
    if (req.query.showAll !== 'true') {
      filter.isAvailable = true;
    }

    const count = await MechanicService.countDocuments(filter);
    const mechanics = await MechanicService.find(filter)
      .populate('mechanic', 'name email phone rating')
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ rating: -1 });

    res.json({
      mechanics,
      page,
      pages: Math.ceil(count / pageSize),
      count,
    });
  } catch (error) {
    console.error('Error getting mechanics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get mechanic by ID
// @route   GET /api/mechanics/:id
// @access  Public
const getMechanicById = async (req, res) => {
  try {
    const mechanicService = await MechanicService.findById(req.params.id)
      .populate('mechanic', 'name email phone rating');

    if (!mechanicService) {
      return res.status(404).json({ message: 'Mechanic not found' });
    }

    res.json(mechanicService);
  } catch (error) {
    console.error('Error getting mechanic:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  updateMechanicProfile,
  getMechanics,
  getMechanicById,
};