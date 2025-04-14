  
const Review = require('../models/reviewModel');
const User = require('../models/userModel');
const Vehicle = require('../models/vehicleModel');
const Booking = require('../models/bookingModel');
const ServiceRequest = require('../models/mechanicServiceRequestModel');
const { createNotification } = require('./notificationController');

  
  
  
const createReview = async (req, res) => {
  try {
    const {
      targetId,
      targetType,
      rating,
      comment,
      bookingId,
      serviceId,
    } = req.body;
    
    if (!targetId || !targetType || !rating || !comment) {
      return res.status(400).json({ 
        message: 'Please provide targetId, targetType, rating, and comment' 
      });
    }
    
  
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
  
    if (!['User', 'Vehicle'].includes(targetType)) {
      return res.status(400).json({ message: 'Invalid target type' });
    }
    
  
    let targetExists;
    if (targetType === 'User') {
      targetExists = await User.findById(targetId);
    } else if (targetType === 'Vehicle') {
      targetExists = await Vehicle.findById(targetId);
    }
    
    if (!targetExists) {
      return res.status(404).json({ message: `${targetType} not found` });
    }
    
  
    const reviewData = {
      user: req.user._id,
      target: targetId,
      targetType,
      rating,
      comment,
    };
    
  
    if (bookingId) {
  
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }
      
  
      if (booking.renter.toString() !== req.user._id.toString() && 
          booking.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to review this booking' });
      }
      
  
      if (booking.status !== 'completed') {
        return res.status(400).json({ message: 'Cannot review incomplete booking' });
      }
      
      reviewData.bookingId = bookingId;
    }
    
    if (serviceId) {
  
      const service = await ServiceRequest.findById(serviceId);
      if (!service) {
        return res.status(404).json({ message: 'Service request not found' });
      }
      
  
      if (service.customer.toString() !== req.user._id.toString() && 
          service.mechanic.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to review this service' });
      }
      
  
      if (service.status !== 'completed') {
        return res.status(400).json({ message: 'Cannot review incomplete service' });
      }
      
      reviewData.serviceId = serviceId;
    }
    
  
    if (bookingId) {
      const existingReview = await Review.findOne({ 
        user: req.user._id, 
        bookingId 
      });
      
      if (existingReview) {
        return res.status(400).json({ message: 'You have already reviewed this booking' });
      }
    }
    
    if (serviceId) {
      const existingReview = await Review.findOne({ 
        user: req.user._id, 
        serviceId 
      });
      
      if (existingReview) {
        return res.status(400).json({ message: 'You have already reviewed this service' });
      }
    }
    
  
    const review = await Review.create(reviewData);
    
  
    if (targetType === 'User') {
  
      const userReviews = await Review.find({ 
        target: targetId, 
        targetType: 'User' 
      });
      
  
      const totalRating = userReviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / userReviews.length;
      
  
      await User.findByIdAndUpdate(targetId, {
        rating: parseFloat(averageRating.toFixed(1)),
        numReviews: userReviews.length,
      });
      
  
      await createNotification(
        targetId,
        'New Review',
        `${req.user.name} left you a ${rating}-star review!`,
        'system'
      );
    } else if (targetType === 'Vehicle') {
  
      const vehicleReviews = await Review.find({ 
        target: targetId, 
        targetType: 'Vehicle' 
      });
      
  
      const totalRating = vehicleReviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / vehicleReviews.length;
      
  
      const vehicle = await Vehicle.findByIdAndUpdate(targetId, {
        rating: parseFloat(averageRating.toFixed(1)),
        numReviews: vehicleReviews.length,
      });
      
  
      if (vehicle) {
        await createNotification(
          vehicle.owner,
          'New Vehicle Review',
          `Your ${vehicle.make} ${vehicle.model} received a ${rating}-star review!`,
          'system'
        );
      }
    }
    
    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

  
  
  
const getReviews = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    
  
    if (!['User', 'Vehicle'].includes(targetType)) {
      return res.status(400).json({ message: 'Invalid target type' });
    }
    
  
    const reviews = await Review.find({ 
      target: targetId, 
      targetType 
    })
      .populate('user', 'name email profileImage')
      .sort({ createdAt: -1 });
    
    res.json(reviews);
  } catch (error) {
    console.error('Error getting reviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createReview,
  getReviews,
};