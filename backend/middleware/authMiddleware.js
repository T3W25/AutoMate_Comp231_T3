const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

/**
 * Middleware to protect routes by verifying JWT token
 * Adds the authenticated user to the request object
 */
const protect = async (req, res, next) => {
  let token;

  // Check if token exists in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token (excluding password)
      req.user = await User.findById(decoded.id).select('-password');
      
      // Check if user exists
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token' });
      } else if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

/**
 * Middleware to restrict routes to specific user roles
 * @param {string[]} roles - Array of allowed roles
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. ${req.user.role} role is not authorized to access this resource` 
      });
    }
    
    next();
  };
};

/**
 * Middleware to validate owning the resource
 * Can be used for routes where the user must own the resource to modify it
 * @param {Function} getOwnerId - Function that extracts owner ID from the request
 */
const isResourceOwner = (getOwnerId) => async (req, res, next) => {
  try {
    // Get the owner ID from the request using the provided function
    const ownerId = await getOwnerId(req);
    
    // Check if the authenticated user is the owner
    if (ownerId && ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Access denied. You are not the owner of this resource' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Resource ownership verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { protect, authorize, isResourceOwner };