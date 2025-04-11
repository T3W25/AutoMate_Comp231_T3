// backend/controllers/mechanicServiceController.js
const ServiceRequest = require('../models/mechanicServiceRequestModel');
const User = require('../models/userModel');
const { createNotification } = require('./notificationController');
const fs = require('fs');
const path = require('path');

// @desc    Create a new service request
// @route   POST /api/mechanic-services
// @access  Private (renters and car owners)

const createServiceRequest = async (req, res) => {
  try {
    console.log('Received service request with body:', req.body);
    console.log('Files received:', req.files);

    const {
      mechanicId,
      vehicleType,
      serviceType,
      description,
      isEmergency,
      scheduledDate,
      location,
    } = req.body;
    
    // Validate all required fields
    if (!mechanicId) {
      console.error('Missing mechanicId in request');
      return res.status(400).json({ message: 'Mechanic ID is required' });
    }

    // Process image uploads more robustly
    const images = [];
    if (req.files && req.files.length > 0) {
      console.log(`Processing ${req.files.length} uploaded images`);
      req.files.forEach(file => {
        // Make sure to use a path that will be accessible from frontend
        const imagePath = `/uploads/service-images/${file.filename}`;
        console.log('Adding image path:', imagePath);
        images.push(imagePath);
      });
    }

    // Verify mechanic exists
    console.log('Looking for mechanic with ID:', mechanicId);
    const mechanic = await User.findById(mechanicId);
    console.log('Mechanic found:', mechanic ? `Yes - ${mechanic.name} (${mechanic.role})` : 'No');

    // Create service request
    const serviceRequest = await ServiceRequest.create({
      customer: req.user._id,
      mechanic: mechanicId,
      vehicleType,
      serviceType,
      description,
      isEmergency: isEmergency === 'true' || isEmergency === true,
      scheduledDate: new Date(scheduledDate),
      location,
      coordinates: {
        latitude: parseFloat(req.body['coordinates[latitude]'] || 0),
        longitude: parseFloat(req.body['coordinates[longitude]'] || 0)
      },
      images,
    });

    console.log('Service request created successfully:', serviceRequest._id);
    res.status(201).json(serviceRequest);
  } catch (error) {
    console.error('Error in createServiceRequest:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: error.stack 
    });
  }
};

// @desc    Get all service requests
// @route   GET /api/mechanic-services
// @access  Private
const getServiceRequests = async (req, res) => {
  try {
    const serviceRequests = await ServiceRequest.find({})
      .sort({ createdAt: -1 })
      .populate('mechanic', 'name email')
      .populate('customer', 'name email');
    
    res.status(200).json(serviceRequests);
  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user's service requests
// @route   GET /api/mechanic-services/user
// @access  Private
const getUserServiceRequests = async (req, res) => {
  try {
    // Fetch service requests where the user is the customer
    const serviceRequests = await ServiceRequest.find({ 
      customer: req.user._id 
    })
    .sort({ createdAt: -1 }) // Sort by most recent first
    .populate('mechanic', 'name email') // Optionally populate mechanic details
    .populate('customer', 'name email'); // Optionally populate customer details

    res.status(200).json(serviceRequests);
  } catch (error) {
    console.error('Error fetching user service requests:', error);
    res.status(500).json({ 
      message: 'Error fetching user service requests', 
      error: error.message 
    });
  }
};

// @desc    Get service request by ID
// @route   GET /api/mechanic-services/:id
// @access  Private
const getServiceRequestById = async (req, res) => {
  try {
    const serviceRequest = await ServiceRequest.findById(req.params.id)
      .populate('mechanic', 'name email')
      .populate('customer', 'name email');
    
    if (!serviceRequest) {
      return res.status(404).json({ message: 'Service request not found' });
    }
    
    res.status(200).json(serviceRequest);
  } catch (error) {
    console.error('Error fetching service request:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update service request status
// @route   PUT /api/mechanic-services/:id
// @access  Private
const updateServiceRequestStatus = async (req, res) => {
  try {
    const { status, totalAmount } = req.body;
    const serviceRequest = await ServiceRequest.findById(req.params.id);
    
    if (!serviceRequest) {
      return res.status(404).json({ message: 'Service request not found' });
    }
    
    serviceRequest.status = status;
    if (totalAmount) {
      serviceRequest.totalAmount = totalAmount;
    }
    
    await serviceRequest.save();
    
    res.status(200).json(serviceRequest);
  } catch (error) {
    console.error('Error updating service request status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Provide estimate for a service request
// @route   PUT /api/mechanic-services/:id/estimate
// @access  Private (mechanic only)
const provideEstimate = async (req, res) => {
  try {
    const { estimatedAmount } = req.body;
    const serviceRequest = await ServiceRequest.findById(req.params.id);
    
    if (!serviceRequest) {
      return res.status(404).json({ message: 'Service request not found' });
    }
    
    // Check if user is the mechanic for this request
    if (serviceRequest.mechanic.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to provide estimate for this request' });
    }
    
    // Check if request is in the correct state
    if (serviceRequest.status !== 'pending') {
      return res.status(400).json({ message: `Cannot provide estimate for a request in ${serviceRequest.status} status` });
    }
    
    // Update the request with the estimate
    serviceRequest.estimatedAmount = estimatedAmount;
    serviceRequest.status = 'estimated';
    serviceRequest.estimatedAt = new Date();
    await serviceRequest.save();
    
    // Create notification for customer
    await createNotification(
      serviceRequest.customer,
      'Estimate Received',
      `Mechanic ${req.user.name} has estimated your repair at $${estimatedAmount}`,
      'service',
      { serviceId: serviceRequest._id }
    );
    
    res.json(serviceRequest);
  } catch (error) {
    console.error('Error providing estimate:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Accept or decline an estimate
// @route   PUT /api/mechanic-services/:id/response
// @access  Private (customer only)
const respondToEstimate = async (req, res) => {
  try {
    const { response } = req.body; // 'accept' or 'decline'
    
    if (!['accept', 'decline'].includes(response)) {
      return res.status(400).json({ message: 'Response must be either accept or decline' });
    }
    
    const serviceRequest = await ServiceRequest.findById(req.params.id);
    
    if (!serviceRequest) {
      return res.status(404).json({ message: 'Service request not found' });
    }
    
    // Check if user is the customer for this request
    if (serviceRequest.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to respond to this estimate' });
    }
    
    // Check if request is in the correct state
    if (serviceRequest.status !== 'estimated') {
      return res.status(400).json({ message: `Cannot respond to a request in ${serviceRequest.status} status` });
    }
    
    // Update the request based on response
    serviceRequest.status = response === 'accept' ? 'accepted' : 'declined';
    await serviceRequest.save();
    
    // Create notification for mechanic
    await createNotification(
      serviceRequest.mechanic,
      `Estimate ${response === 'accept' ? 'Accepted' : 'Declined'}`,
      `Customer ${req.user.name} has ${response === 'accept' ? 'accepted' : 'declined'} your estimate`,
      'service',
      { serviceId: serviceRequest._id }
    );
    
    res.json(serviceRequest);
  } catch (error) {
    console.error('Error responding to estimate:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark service request as completed
// @route   PUT /api/mechanic-services/:id/complete
// @access  Private (mechanic only)
const completeServiceRequest = async (req, res) => {
  try {
    const { finalAmount } = req.body;
    
    const serviceRequest = await ServiceRequest.findById(req.params.id);
    
    if (!serviceRequest) {
      return res.status(404).json({ message: 'Service request not found' });
    }
    
    // Check if user is the mechanic for this request
    if (serviceRequest.mechanic.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to complete this request' });
    }
    
    // Check if request is in the correct state
    if (serviceRequest.status !== 'accepted') {
      return res.status(400).json({ message: `Cannot complete a request in ${serviceRequest.status} status` });
    }
    
    // Update the request
    serviceRequest.status = 'completed';
    serviceRequest.finalAmount = finalAmount || serviceRequest.estimatedAmount;
    serviceRequest.completedAt = new Date();
    await serviceRequest.save();
    
    // Create notification for customer
    await createNotification(
      serviceRequest.customer,
      'Service Completed',
      `Mechanic ${req.user.name} has completed your service request`,
      'service',
      { serviceId: serviceRequest._id }
    );
    
    res.json(serviceRequest);
  } catch (error) {
    console.error('Error completing service request:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Process payment for service request
// @route   POST /api/mechanic-services/:id/payment
// @access  Private (customer only)
const processServicePayment = async (req, res) => {
  try {
    const { paymentMethodId, cardDetails } = req.body;
    
    const serviceRequest = await ServiceRequest.findById(req.params.id);
    
    if (!serviceRequest) {
      return res.status(404).json({ message: 'Service request not found' });
    }
    
    // Check if user is the customer for this request
    if (serviceRequest.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to pay for this request' });
    }
    
    // Check if request is in the correct state
    if (serviceRequest.status !== 'completed') {
      return res.status(400).json({ message: `Cannot pay for a request in ${serviceRequest.status} status` });
    }
    
    // Check if already paid
    if (serviceRequest.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'This service request has already been paid for' });
    }
    
    // Simulate payment processing
    const paymentId = `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    // Update the request
    serviceRequest.paymentStatus = 'paid';
    serviceRequest.paymentId = paymentId;
    await serviceRequest.save();
    
    // Create notification for mechanic
    await createNotification(
      serviceRequest.mechanic,
      'Payment Received',
      `Customer ${req.user.name} has paid $${serviceRequest.finalAmount} for your service`,
      'payment',
      { serviceId: serviceRequest._id }
    );
    
    res.json({
      success: true,
      paymentId,
      amount: serviceRequest.finalAmount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ message: 'Payment processing failed' });
  }
};

// Export all methods
module.exports = {
  createServiceRequest,
  getServiceRequests,
  getUserServiceRequests,
  getServiceRequestById,
  updateServiceRequestStatus,
  provideEstimate,
  respondToEstimate,
  completeServiceRequest,
  processServicePayment,
};