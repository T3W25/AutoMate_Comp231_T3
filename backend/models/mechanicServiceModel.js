const mongoose = require('mongoose');

const mechanicServiceSchema = new mongoose.Schema({
  mechanic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  serviceName: {
    type: String,
    required: true,
  },
  services: [{
    type: String,
    trim: true
  }],
  description: {
    type: String,
    required: true,
  },
  hourlyRate: {
    type: Number,
    required: true,
  },
  experience: {
    years: {
      type: Number,
      default: 0
    },
    description: {
      type: String,
      default: ''
    }
  },
  specialization: [{
    type: String,
    required: true,
    trim: true
  }],
  location: {
    type: String,
    required: true,
  },
  coordinates: {
    latitude: {
      type: Number,
      default: 0,
    },
    longitude: {
      type: Number,
      default: 0,
    },
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  workingHours: {
    start: {
      type: String,
      default: '09:00',
      validate: {
        validator: function(v) {
          return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
        },
        message: props => `${props.value} is not a valid time format! Use HH:MM`
      }
    },
    end: {
      type: String,
      default: '18:00',
      validate: {
        validator: function(v) {
          return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
        },
        message: props => `${props.value} is not a valid time format! Use HH:MM`
      }
    }
  },
  daysAvailable: {
    monday: { type: Boolean, default: true },
    tuesday: { type: Boolean, default: true },
    wednesday: { type: Boolean, default: true },
    thursday: { type: Boolean, default: true },
    friday: { type: Boolean, default: true },
    saturday: { type: Boolean, default: true },
    sunday: { type: Boolean, default: false },
  },
  rating: {
    type: Number,
    default: 0,
  },
  numReviews: {
    type: Number,
    default: 0,
  },
  certifications: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  shareLocation: {
    type: Boolean,
    default: false,
  },
  officeAddress: {
    type: String,
    default: '',
  },
  currentLocation: {
    latitude: {
      type: Number,
      default: 0,
    },
    longitude: {
      type: Number,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    profileImage: {
      type: String,
      default: '',
    },
  },
});

const MechanicService = mongoose.model('MechanicService', mechanicServiceSchema);

module.exports = MechanicService;