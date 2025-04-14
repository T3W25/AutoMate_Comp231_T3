  
  

const simulatePaymentProcessing = () => {
    return new Promise((resolve, reject) => {
  
      setTimeout(() => {
  
        const isSuccess = Math.random() < 0.9;
        
        if (isSuccess) {
          resolve({
            success: true,
            transactionId: `TRX-${Math.floor(Math.random() * 1000000)}`,
            timestamp: new Date().toISOString(),
          });
        } else {
          reject(new Error('Payment processing failed. Please try again.'));
        }
      }, 2000);
    });
  };
  
  export const processPayment = async (paymentDetails) => {
    try {
  
      if (!paymentDetails.cardNumber || !paymentDetails.expiryDate || !paymentDetails.cvv) {
        throw new Error('Invalid payment details');
      }
      
  
      const result = await simulatePaymentProcessing();
      return result;
    } catch (error) {
      console.error('Payment error:', error);
      throw error;
    }
  };
  
  export const getPaymentMethods = async (userId) => {
  
    return [
      {
        id: 'pm_1',
        type: 'card',
        brand: 'Visa',
        last4: '4242',
        expiryMonth: 12,
        expiryYear: 2025,
        isDefault: true,
      },
      {
        id: 'pm_2',
        type: 'card',
        brand: 'Mastercard',
        last4: '5555',
        expiryMonth: 10,
        expiryYear: 2024,
        isDefault: false,
      },
    ];
  };