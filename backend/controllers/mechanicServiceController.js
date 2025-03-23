// backend/controllers/mechanicServiceController.js
const ServiceRequest = require('../models/mechanicServiceRequestModel');
const User = require('../models/userModel');

// @desc    Create a new service request
// @route   POST /api/mechanic-services
// @access  Private (renters and car owners)
const createServiceRequest = async (req, res) => {
  try {
    const {
      mechanicId,
      vehicleType,
      serviceType,
      description,
      isEmergency,
      scheduledDate,
      location,
      coordinates,
      images,
    } = req.body;

    // Validate mechanic exists and is of role "mechanic"
    const mechanic = await User.findById(mechanicId);
    if (!mechanic || mechanic.role !== 'mechanic') {
      return res.status(404).json({ message: 'Mechanic not found' });
    }

    // Check if user is a renter or car owner
    if (req.user.role !== 'renter' && req.user.role !== 'carOwner') {
      return res.status(403).json({ message: 'Only renters and car owners can create service requests' });
    }

    // Create service request
    const serviceRequest = await ServiceRequest.create({
      customer: req.user._id,
      mechanic: mechanicId,
      vehicleType,
      serviceType,
      description,
      isEmergency,
      scheduledDate,
      location,
      coordinates,
      images,
    });

    res.status(201).json(serviceRequest);
  } catch (error) {
    console.error('Error creating service request:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all service requests for a user (as customer or mechanic)
// @route   GET /api/mechanic-services
// @access  Private
const getServiceRequests = async (req, res) => {
  try {
    let serviceRequests;
    const userRole = req.user.role;

    if (userRole === 'mechanic') {
      // If user is a mechanic, get requests where they are the mechanic
      serviceRequests = await ServiceRequest.find({ mechanic: req.user._id })
        .populate('customer', 'name email phone rating')
        .sort({ createdAt: -1 });
    } else if (userRole === 'renter' || userRole === 'carOwner') {
      // If user is a renter or car owner, get requests where they are the customer
      serviceRequests = await ServiceRequest.find({ customer: req.user._id })
        .populate('mechanic', 'name email phone rating')
        .sort({ createdAt: -1 });
    } else {
      return res.status(403).json({ message: 'Unauthorized to view service requests' });
    }

    res.json(serviceRequests);
  } catch (error) {
    console.error('Error getting service requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get service request by ID
// @route   GET /api/mechanic-services/:id
// @access  Private (request participants only)
const getServiceRequestById = async (req, res) => {
  try {
    const serviceRequest = await ServiceRequest.findById(req.params.id)
      .populate('customer', 'name email phone rating')
      .populate('mechanic', 'name email phone rating');

    if (!serviceRequest) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    // Check if user is a participant in this service request
    if (
      serviceRequest.customer._id.toString() !== req.user._id.toString() &&
      serviceRequest.mechanic._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized to view this service request' });
    }

    res.json(serviceRequest);
  } catch (error) {
    console.error('Error getting service request:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update service request status
// @route   PUT /api/mechanic-services/:id
// @access  Private (mechanic or customer)
const updateServiceRequestStatus = async (req, res) => {
  try {
    const { status, totalAmount } = req.body;

    const serviceRequest = await ServiceRequest.findById(req.params.id);

    if (!serviceRequest) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    // Check if user is a participant in this service request
    const userIsMechanic = serviceRequest.mechanic.toString() === req.user._id.toString();
    const userIsCustomer = serviceRequest.customer.toString() === req.user._id.toString();

    if (!userIsMechanic && !userIsCustomer && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this service request' });
    }

    // Validate status
    const validStatuses = ['accepted', 'declined', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Only mechanic can accept or decline
    if ((status === 'accepted' || status === 'declined') && !userIsMechanic) {
      return res.status(403).json({ message: 'Only the mechanic can accept or decline service requests' });
    }

    // Only customer can cancel
    if (status === 'cancelled' && !userIsCustomer) {
      return res.status(403).json({ message: 'Only the customer can cancel service requests' });
    }

    // Only mechanic can mark as completed
    if (status === 'completed' && !userIsMechanic) {
      return res.status(403).json({ message: 'Only the mechanic can mark service requests as completed' });
    }

    // Update service request
    serviceRequest.status = status;
    
    if (status === 'accepted' && totalAmount) {
      serviceRequest.totalAmount = totalAmount;
    }

    await serviceRequest.save();
    res.json(serviceRequest);
  } catch (error) {
    console.error('Error updating service request:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createServiceRequest,
  getServiceRequests,
  getServiceRequestById,
  updateServiceRequestStatus,
};