const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { connectDB, setupMongooseEvents } = require('./config/db');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads/service-images');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
connectDB()
  .then(() => {
    setupMongooseEvents();
    // Continue with server setup after successful DB connection
    startServer();
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });

// Function to start the server after DB connection
const startServer = () => {
  // Routes
  app.use('/api/users', require('./routes/userRoutes'));
  app.use('/api/vehicles', require('./routes/vehicleRoutes'));
  app.use('/api/bookings', require('./routes/bookingRoutes'));
  app.use('/api/mechanic-services', require('./routes/mechanicServiceRoutes'));
  app.use('/api/mechanics', require('./routes/mechanicRoutes'));
  app.use('/api/payments', require('./routes/paymentRoutes'));
  app.use('/api/location', require('./routes/locationRoutes'));
  app.use('/api/notifications', require('./routes/notificationRoutes'));
  app.use('/api/reviews', require('./routes/reviewRoutes'));
  app.use('/api/admin', require('./routes/adminRoutes'));

  // Health check endpoint
  app.get('/api/health', async (req, res) => {
    try {
      // Get the state of the database connection
      const dbState = mongoose.connection.readyState;
      const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };
      
      res.json({
        status: 'ok',
        dbConnection: states[dbState],
        timestamp: new Date().toISOString(),
        modelCount: Object.keys(mongoose.models).length,
        models: Object.keys(mongoose.models)
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  });

  // Add a route for booking history by vehicle
  app.get('/api/bookings/vehicle/:id', require('./controllers/bookingController').getVehicleBookings);

  // API test route
  app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is running correctly' });
  });

  // Default route
  app.get('/', (req, res) => {
    res.send('AutoMate API is running');
  });

  // 404 handler for unmatched routes
  app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });

  // Error handling middleware with enhanced logging
  app.use((err, req, res, next) => {
    console.error('Error details:');
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    console.error('Request path:', req.path);
    console.error('Request method:', req.method);
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    res.status(statusCode).json({
      success: false,
      message,
      stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
    });
  });

  // Start server
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});