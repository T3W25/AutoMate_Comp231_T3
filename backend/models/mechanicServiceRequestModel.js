const mongoose = require('mongoose');

const mechanicServiceRequestSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mechanic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vehicleType: {
    type: String,
    required: true
  },
  serviceType: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  images: [{
    type: String 
  }],
  isEmergency: {
    type: Boolean,
    default: false
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'estimated', 'accepted', 'completed', 'declined', 'cancelled'],
    default: 'pending'
  },
  estimatedAmount: {
    type: Number,
    default: 0
  },
  finalAmount: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid'],
    default: 'unpaid'
  },
  location: {
    type: String,
    default: ''
  },
  coordinates: {
    latitude: {
      type: Number,
      default: 0
    },
    longitude: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const MechanicServiceRequest = mongoose.model('MechanicServiceRequest', mechanicServiceRequestSchema);

module.exports = MechanicServiceRequest;