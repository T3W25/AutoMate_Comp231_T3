const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const MechanicService = require('../models/mechanicServiceModel');

  
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

  
  
  
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    
    console.log('Attempting to register user:', { name, email, role, phone });
    
  
    const userExists = await User.findOne({ email });

    if (userExists) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

  
    console.log('Creating new user in database');
    const user = await User.create({
      name,
      email,
      password, 
      role,
      phone,
    });

    if (user) {
      console.log('User created successfully:', user._id);
      
  
      if (role === 'mechanic') {
        try {
  
          await MechanicService.create({
            mechanic: user._id,
            serviceName: `${name}'s Repair Service`,
            description: 'Professional repair services',
            hourlyRate: 70,
            specialization: 'General Repair',
            location: 'Not specified',
            isAvailable: true,
          });
          console.log('Created mechanic profile for:', user._id);
        } catch (mechanicError) {
          console.error('Error creating mechanic profile:', mechanicError);
        }
      }
      
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        token: generateToken(user._id),
      });
    } else {
      console.log('Invalid user data');
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Error in registerUser:', error);
    res.status(500).json({ message: 'Server error', error: error.toString() });
  }
};

  
  
  
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

  
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

  
  
  
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


const getMechanics = async (req, res) => {
  try {
    const mechanics = await User.find({ role: 'mechanic' });
    
    if (!mechanics || mechanics.length === 0) {
      return res.status(404).json({ message: 'No mechanics found' });
    }
    
  
    const mechanicsData = mechanics.map(mechanic => ({
      _id: mechanic._id,
      name: mechanic.name,
      email: mechanic.email,
      phone: mechanic.phone,
      rating: mechanic.rating || 0,
      numReviews: mechanic.numReviews || 0,
      profileImage: mechanic.profileImage || null,
      address: mechanic.address || '',
    }));
    
    res.json(mechanicsData);
  } catch (error) {
    console.error('Error getting mechanics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


module.exports = { registerUser, loginUser, getUserProfile, getMechanics };