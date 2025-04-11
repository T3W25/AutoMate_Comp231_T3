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
      certifications,
      shareLocation,
      officeAddress,
      profileImage,
      experience,
      services,
    } = req.body;

    // Check if user is a mechanic
    if (req.user.role !== 'mechanic') {
      return res.status(403).json({ message: 'Only mechanics can update mechanic profiles' });
    }

    // Ensure specialization is always an array
    const normalizedSpecializations = Array.isArray(specialization) 
      ? specialization.filter(Boolean)
      : [specialization].filter(Boolean);

    // Find existing mechanic profile or create a new one
    let mechanicProfile = await MechanicService.findOne({ mechanic: req.user._id });

    // Prepare update data
    const updateData = {
      mechanic: req.user._id,
      serviceName: serviceName || (mechanicProfile ? mechanicProfile.serviceName : ''),
      description: description || (mechanicProfile ? mechanicProfile.description : ''),
      hourlyRate: hourlyRate || (mechanicProfile ? mechanicProfile.hourlyRate : 0),
      specialization: normalizedSpecializations,
      location: location || (mechanicProfile ? mechanicProfile.location : ''),
      coordinates: coordinates || { latitude: 0, longitude: 0 },
      isAvailable: isAvailable !== undefined 
        ? isAvailable 
        : (mechanicProfile ? mechanicProfile.isAvailable : true),
      workingHours: workingHours || (mechanicProfile ? mechanicProfile.workingHours : { start: '09:00', end: '18:00' }),
      daysAvailable: daysAvailable || (mechanicProfile ? mechanicProfile.daysAvailable : {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: false
      }),
      certifications: certifications || (mechanicProfile ? mechanicProfile.certifications : []),
      shareLocation: shareLocation !== undefined 
        ? shareLocation 
        : (mechanicProfile ? mechanicProfile.shareLocation : false),
      officeAddress: officeAddress || (mechanicProfile ? mechanicProfile.officeAddress : ''),
      profileImage: profileImage || (mechanicProfile ? mechanicProfile.profileImage : '')
    };

    // Add experience and services to update data
    updateData.experience = experience || { years: 0, description: '' }; 
    updateData.services = services || [];

    try {
      // Update or create profile
      if (mechanicProfile) {
        // Update existing profile
        mechanicProfile = await MechanicService.findOneAndUpdate(
          { mechanic: req.user._id },
          updateData,
          { new: true, runValidators: true }
        );
      } else {
        // Create new profile
        mechanicProfile = await MechanicService.create(updateData);
      }

      res.json(mechanicProfile);
    } catch (updateError) {
      console.error('Error saving mechanic profile:', updateError);
      res.status(500).json({ 
        message: 'Error saving mechanic profile', 
        error: updateError.message 
      });
    }
  } catch (error) {
    console.error('Error processing mechanic profile update:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
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
      filter.specialization = { 
        $elemMatch: { 
          $regex: req.query.specialization, 
          $options: 'i' 
        } 
      };
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
      .populate('mechanic', 'name email phone rating profileImage')
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
      .populate('mechanic', 'name email phone rating profileImage');

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