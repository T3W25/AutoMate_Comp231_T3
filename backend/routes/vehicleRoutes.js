const express = require('express');
const router = express.Router();
const { 
  addVehicle, 
  getVehicles, 
  getOwnerVehicles, 
  getVehicleById, 
  updateVehicle, 
  deleteVehicle 
} = require('../controllers/vehicleController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, addVehicle)
  .get(getVehicles);

router.route('/owner')
  .get(protect, getOwnerVehicles);

router.route('/:id')
  .get(getVehicleById)
  .put(protect, updateVehicle)
  .delete(protect, deleteVehicle);

module.exports = router;