// backend/models/reviewModel.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  target: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetType',
  },
  targetType: {
    type: String,
    required: true,
    enum: ['User', 'Vehicle'],
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceRequest',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Prevent user from reviewing the same booking/service more than once
reviewSchema.index({ user: 1, bookingId: 1 }, { unique: true, sparse: true });
reviewSchema.index({ user: 1, serviceId: 1 }, { unique: true, sparse: true });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;