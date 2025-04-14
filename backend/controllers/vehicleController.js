const Vehicle = require('../models/vehicleModel');
const User = require('../models/userModel');

  
  
  
const addVehicle = async (req, res) => {
  try {
    const {
      make,
      model,
      year,
      licensePlate,
      vehicleType,
      transmission,
      fuelType,
      seats,
      pricePerDay,
      isAvailable,
      location,
      description,
      features,
    } = req.body;

  
    if (req.user.role !== 'carOwner') {
      return res.status(403).json({ message: 'Only car owners can add vehicles' });
    }

  
    const vehicle = await Vehicle.create({
      owner: req.user._id,
      make,
      model,
      year,
      licensePlate,
      vehicleType,
      transmission,
      fuelType,
      seats,
      pricePerDay,
      isAvailable,
      location,
      description,
      features,
    });

    if (vehicle) {
      res.status(201).json(vehicle);
    } else {
      res.status(400).json({ message: 'Invalid vehicle data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

  
  
  
const getVehicles = async (req, res) => {
  try {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;
    
  
    const filter = {};
    
    if (req.query.make) {
      filter.make = { $regex: req.query.make, $options: 'i' };
    }
    
    if (req.query.model) {
      filter.model = { $regex: req.query.model, $options: 'i' };
    }
    
    if (req.query.location) {
      filter.location = { $regex: req.query.location, $options: 'i' };
    }
    
    if (req.query.vehicleType) {
      filter.vehicleType = req.query.vehicleType;
    }
    
    if (req.query.minPrice && req.query.maxPrice) {
      filter.pricePerDay = { 
        $gte: Number(req.query.minPrice), 
        $lte: Number(req.query.maxPrice) 
      };
    } else if (req.query.minPrice) {
      filter.pricePerDay = { $gte: Number(req.query.minPrice) };
    } else if (req.query.maxPrice) {
      filter.pricePerDay = { $lte: Number(req.query.maxPrice) };
    }
    
  
    if (req.query.showAll !== 'true') {
      filter.isAvailable = true;
    }

    const count = await Vehicle.countDocuments(filter);
    const vehicles = await Vehicle.find(filter)
      .populate('owner', 'name email phone rating')
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ createdAt: -1 });

    res.json({
      vehicles,
      page,
      pages: Math.ceil(count / pageSize),
      count,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

  
  
  
const getOwnerVehicles = async (req, res) => {
  try {
  
    if (req.user.role !== 'carOwner') {
      return res.status(403).json({ message: 'Only car owners can access this route' });
    }

    const vehicles = await Vehicle.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json(vehicles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

  
  
  
const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('owner', 'name email phone rating');

    if (vehicle) {
      res.json(vehicle);
    } else {
      res.status(404).json({ message: 'Vehicle not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

  
  
  
const updateVehicle = async (req, res) => {
  try {
    const {
      make,
      model,
      year,
      licensePlate,
      vehicleType,
      transmission,
      fuelType,
      seats,
      pricePerDay,
      isAvailable,
      location,
      description,
      features,
    } = req.body;

    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

  
    if (vehicle.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to update this vehicle' });
    }

  
    vehicle.make = make || vehicle.make;
    vehicle.model = model || vehicle.model;
    vehicle.year = year || vehicle.year;
    vehicle.licensePlate = licensePlate || vehicle.licensePlate;
    vehicle.vehicleType = vehicleType || vehicle.vehicleType;
    vehicle.transmission = transmission || vehicle.transmission;
    vehicle.fuelType = fuelType || vehicle.fuelType;
    vehicle.seats = seats || vehicle.seats;
    vehicle.pricePerDay = pricePerDay || vehicle.pricePerDay;
    vehicle.isAvailable = isAvailable !== undefined ? isAvailable : vehicle.isAvailable;
    vehicle.location = location || vehicle.location;
    vehicle.description = description || vehicle.description;
    vehicle.features = features || vehicle.features;

    const updatedVehicle = await vehicle.save();
    res.json(updatedVehicle);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

  
  
  
const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

  
    if (vehicle.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to delete this vehicle' });
    }

    await vehicle.deleteOne();
    res.json({ message: 'Vehicle removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { 
  addVehicle, 
  getVehicles, 
  getOwnerVehicles, 
  getVehicleById, 
  updateVehicle, 
  deleteVehicle 
};

