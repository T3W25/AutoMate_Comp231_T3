  
const Booking = require('../models/bookingModel');
const ServiceRequest = require('../models/mechanicServiceRequestModel');

  
const processPayment = async (amount, paymentDetails) => {
  return {
    success: true,
    transactionId: `TRX-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    amount,
    timestamp: new Date().toISOString()
  };
};

  
  
  
const createPayment = async (req, res) => {
  try {
    const {
      bookingId,
      serviceRequestId,
      amount,
      paymentMethodId,
      cardDetails
    } = req.body;

    if (!amount || (!bookingId && !serviceRequestId)) {
      return res.status(400).json({
        message: 'Please provide amount and either bookingId or serviceRequestId'
      });
    }

  
    const paymentResult = await processPayment(amount, paymentMethodId || cardDetails);

  
    if (bookingId) {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      booking.paymentStatus = 'paid';
      booking.paymentId = paymentResult.transactionId;
      await booking.save();
    }

  
    if (serviceRequestId) {
      const serviceRequest = await ServiceRequest.findById(serviceRequestId);
      if (!serviceRequest) {
        return res.status(404).json({ message: 'Service request not found' });
      }

      serviceRequest.paymentStatus = 'paid';
      serviceRequest.paymentId = paymentResult.transactionId;
      await serviceRequest.save();
    }

    res.status(200).json({
      success: true,
      transactionId: paymentResult.transactionId,
      amount,
      timestamp: paymentResult.timestamp
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ message: 'Payment processing failed' });
  }
};

  
  
  
const getPaymentMethods = async (req, res) => {
  try {
  
  
    res.json([
      {
        id: 'pm_1',
        type: 'card',
        brand: 'Visa',
        last4: '4242',
        expiryMonth: 12,
        expiryYear: 2026,
        isDefault: true,
      },
      {
        id: 'pm_2',
        type: 'card',
        brand: 'Mastercard',
        last4: '5555',
        expiryMonth: 10,
        expiryYear: 2025,
        isDefault: false,
      },
    ]);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ message: 'Failed to fetch payment methods' });
  }
};

module.exports = {
  createPayment,
  getPaymentMethods,
};