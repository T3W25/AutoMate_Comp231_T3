  
const User = require('../models/userModel');
const MechanicService = require('../models/mechanicServiceModel');

  
  
  
const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
  
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }
    
  
    if (req.user.role !== 'mechanic') {
      return res.status(403).json({ message: 'Only mechanics can update location' });
    }
    
  
    const mechanicProfile = await MechanicService.findOne({ mechanic: req.user._id });
    
    if (!mechanicProfile) {
      return res.status(404).json({ message: 'Mechanic profile not found' });
    }
    
  
    if (!mechanicProfile.shareLocation) {
      return res.status(400).json({ message: 'Location sharing is disabled' });
    }
    
  
    mechanicProfile.currentLocation = {
      latitude,
      longitude,
      lastUpdated: new Date()
    };
    
    await mechanicProfile.save();
    
    res.status(200).json({ 
      success: true,
      location: {
        latitude,
        longitude,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

  
  
  
const getMechanicLocation = async (req, res) => {
  try {
    const mechanicId = req.params.id;
    
  
    const mechanicProfile = await MechanicService.findOne({ mechanic: mechanicId });
    
    if (!mechanicProfile) {
      return res.status(404).json({ message: 'Mechanic profile not found' });
    }
    
  
    if (!mechanicProfile.shareLocation) {
      return res.status(400).json({ message: 'Location sharing is disabled' });
    }
    
  
    if (!mechanicProfile.currentLocation || 
        !mechanicProfile.currentLocation.lastUpdated || 
        new Date() - new Date(mechanicProfile.currentLocation.lastUpdated) > 10 * 60 * 1000) {
      return res.status(404).json({ message: 'Current location not available' });
    }
    
    res.status(200).json({
      latitude: mechanicProfile.currentLocation.latitude,
      longitude: mechanicProfile.currentLocation.longitude,
      lastUpdated: mechanicProfile.currentLocation.lastUpdated
    });
  } catch (error) {
    console.error('Error getting mechanic location:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  updateLocation,
  getMechanicLocation
};