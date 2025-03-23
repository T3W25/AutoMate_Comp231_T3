const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  make: {
    type: String,
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  licensePlate: {
    type: String,
    required: true,
  },
  vehicleType: {
    type: String,
    enum: ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Truck', 'Van'],
    required: true,
  },
  transmission: {
    type: String,
    enum: ['Automatic', 'Manual'],
    required: true,
  },
  fuelType: {
    type: String,
    enum: ['Gasoline', 'Diesel', 'Electric', 'Hybrid'],
    required: true,
  },
  seats: {
    type: Number,
    required: true,
  },
  pricePerDay: {
    type: Number,
    required: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
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
  description: {
    type: String,
    default: '',
  },
  images: [String],
  features: {
    hasAC: { type: Boolean, default: true },
    hasGPS: { type: Boolean, default: false },
    hasBluetooth: { type: Boolean, default: true },
    hasUSB: { type: Boolean, default: true },
    hasChildSeat: { type: Boolean, default: false },
  },
  rating: {
    type: Number,
    default: 0,
  },
  numReviews: {
    type: Number,
    default: 0,
  },
  totalRentals: {
    type: Number,
    default: 0,
  },
  totalEarnings: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;