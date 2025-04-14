const Booking = require('../models/bookingModel');
const Vehicle = require('../models/vehicleModel');
const User = require('../models/userModel');

  
  
  
const createBooking = async (req, res) => {
  try {
    const { vehicleId, startDate, endDate, notes } = req.body;

  
    if (req.user.role !== 'renter') {
      return res.status(403).json({ message: 'Only renters can create bookings' });
    }

  
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

  
    if (!vehicle.isAvailable) {
      return res.status(400).json({ message: 'Vehicle is not available for booking' });
    }

  
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    if (start < new Date()) {
      return res.status(400).json({ message: 'Start date must be in the future' });
    }

  
    const overlappingBookings = await Booking.find({
      vehicle: vehicleId,
      status: { $in: ['pending', 'approved'] },
      $or: [
  
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
  
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
  
        { startDate: { $gte: startDate }, endDate: { $lte: endDate } },
      ],
    });

    if (overlappingBookings.length > 0) {
      return res.status(400).json({ message: 'Vehicle is already booked during this period' });
    }

  
    const durationMs = end.getTime() - start.getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

  
    const totalAmount = vehicle.pricePerDay * durationDays;

  
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

  
  
  
const getUserBookings = async (req, res) => {
  try {
    let bookings;

  
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
  
    else {
      return res.status(403).json({ message: 'Only renters and car owners can access bookings' });
    }

    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

  
  
  
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

  
  
  
const getVehicleBookings = async (req, res) => {
  try {
    const vehicleId = req.params.id;
    
  
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
  
    const bookings = await Booking.find({
      vehicle: vehicleId,
      status: { $in: ['approved', 'pending'] }
    })
    .select('startDate endDate status')
    .sort({ startDate: 1 });
    
    res.json(bookings);
  } catch (error) {
    console.error('Error getting vehicle bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

  
  
  
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

  
    const validStatuses = ['approved', 'declined', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

  
    const isOwner = booking.owner.toString() === req.user._id.toString();
    const isRenter = booking.renter.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

  
    if ((status === 'approved' || status === 'declined') && !isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Only the vehicle owner can approve or decline bookings' });
    }

  
    if (status === 'cancelled' && !isRenter && !isAdmin) {
      return res.status(403).json({ message: 'Only the renter can cancel booking requests' });
    }

  
    if (status === 'cancelled' && booking.status === 'approved') {
      const startDate = new Date(booking.startDate);
      const now = new Date();
      const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursUntilStart < 24) {
        return res.status(400).json({ message: 'Cannot cancel booking less than 24 hours before start time' });
      }
    }

  
    if (status === 'completed' && !isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Only the vehicle owner can mark bookings as completed' });
    }

    if (status === 'completed' && booking.status !== 'approved') {
      return res.status(400).json({ message: 'Only approved bookings can be marked as completed' });
    }

  
    booking.status = status;
    const updatedBooking = await booking.save();

  
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
  getVehicleBookings
};