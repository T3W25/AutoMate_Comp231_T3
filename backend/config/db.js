// config/db.js
const mongoose = require('mongoose');

/**
 * Establish a connection to MongoDB database
 * @returns {Promise} - Returns a promise that resolves when the connection is established
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // No need for useNewUrlParser, useUnifiedTopology, useCreateIndex - they are now default
      // These options were needed in older versions of mongoose
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1); // Exit with failure
  }
};

// Set up event handlers for the mongoose connection
const setupMongooseEvents = () => {
  mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
  });
  
  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected, attempting to reconnect...');
  });
  
  // Handle process termination
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed due to app termination');
    process.exit(0);
  });
};

module.exports = { connectDB, setupMongooseEvents };