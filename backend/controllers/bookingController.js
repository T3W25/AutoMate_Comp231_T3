const Booking = require('../models/bookingModel');
const Vehicle = require('../models/vehicleModel');
const User = require('../models/userModel');

// @desc    Create a new booking request
// @route   POST /api/bookings
// @access  Private (renters only)
const createBooking = async (req, res) => {
  try {
    const { vehicleId, startDate, endDate, notes } = req.body;

    // Check if user is a renter
    if (req.user.role !== 'renter') {
      return res.status(403).json({ message: 'Only renters can create bookings' });
    }

    // Check if vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Check if vehicle is available
    if (!vehicle.isAvailable) {
      return res.status(400).json({ message: 'Vehicle is not available for booking' });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    if (start < new Date()) {
      return res.status(400).json({ message: 'Start date must be in the future' });
    }

    // Calculate rental duration in days
    const durationMs = end.getTime() - start.getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

    // Calculate total amount
    const totalAmount = vehicle.pricePerDay * durationDays;

    // Create booking
    const booking = await Booking.create({
      vehicle: vehicleId,
      renter: req.user._id,
      owner: vehicle.owner,
      startDate,
      endDate,
      totalAmount,
      notes,
    });

    if (booking) {
      res.status(201).json(booking);
    } else {
      res.status(400).json({ message: 'Invalid booking data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all bookings for the current user
// @route   GET /api/bookings
// @access  Private
const getUserBookings = async (req, res) => {
  try {
    let bookings;

    // If user is a renter, get bookings as a renter
    if (req.user.role === 'renter') {
      bookings = await Booking.find({ renter: req.user._id })
        .populate({
          path: 'vehicle',
          select: 'make model year licensePlate pricePerDay location',
        })
        .populate({
          path: 'owner',
          select: 'name email phone rating',
        })
        .sort({ createdAt: -1 });
    } 
    // If user is a car owner, get bookings for their vehicles
    else if (req.user.role === 'carOwner') {
      bookings = await Booking.find({ owner: req.user._id })
        .populate({
          path: 'vehicle',
          select: 'make model year licensePlate pricePerDay location',
        })
        .populate({
          path: 'renter',
          select: 'name email phone rating',
        })
        .sort({ createdAt: -1 });
    }
    // If user is not a renter or car owner, return error
    else {
      return res.status(403).json({ message: 'Only renters and car owners can access bookings' });
    }

    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private (booking participants only)
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'vehicle',
        select: 'make model year licensePlate pricePerDay location features images',
      })
      .populate({
        path: 'renter',
        select: 'name email phone rating',
      })
      .populate({
        path: 'owner',
        select: 'name email phone rating',
      });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is a participant in the booking
    if (
      booking.renter._id.toString() !== req.user._id.toString() &&
      booking.owner._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'You are not authorized to view this booking' });
    }

    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id
// @access  Private (booking participants only)
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Validate status
    const validStatuses = ['approved', 'declined', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Check user authorization
    const isOwner = booking.owner.toString() === req.user._id.toString();
    const isRenter = booking.renter.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    // Only owner can approve or decline
    if ((status === 'approved' || status === 'declined') && !isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Only the vehicle owner can approve or decline bookings' });
    }

    // Only renter can cancel (if not yet approved)
    if (status === 'cancelled' && !isRenter && !isAdmin) {
      return res.status(403).json({ message: 'Only the renter can cancel booking requests' });
    }

    // Can't cancel an already approved booking that's close to start date
    if (status === 'cancelled' && booking.status === 'approved') {
      const startDate = new Date(booking.startDate);
      const now = new Date();
      const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursUntilStart < 24) {
        return res.status(400).json({ message: 'Cannot cancel booking less than 24 hours before start time' });
      }
    }

    // Only owner can mark as completed (and only if it was approved)
    if (status === 'completed' && !isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Only the vehicle owner can mark bookings as completed' });
    }

    if (status === 'completed' && booking.status !== 'approved') {
      return res.status(400).json({ message: 'Only approved bookings can be marked as completed' });
    }

    // Update booking status
    booking.status = status;
    const updatedBooking = await booking.save();

    // If booking is completed, update vehicle stats
    if (status === 'completed') {
      const vehicle = await Vehicle.findById(booking.vehicle);
      if (vehicle) {
        vehicle.totalRentals += 1;
        vehicle.totalEarnings += booking.totalAmount;
        await vehicle.save();
      }
    }

    res.json(updatedBooking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBookingStatus,
};