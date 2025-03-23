import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { processPayment, getPaymentMethods } from '../services/paymentService';

const PaymentForm = ({ amount, onClose, onPaymentComplete }) => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // New card details
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [saveCard, setSaveCard] = useState(true);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setIsLoading(true);
      const methods = await getPaymentMethods();
      setPaymentMethods(methods);
      
      // Auto-select default payment method
      const defaultMethod = methods.find(method => method.isDefault);
      if (defaultMethod) {
        setSelectedPaymentMethod(defaultMethod.id);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCardNumber = (text) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    
    // Add spaces after every 4 digits
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    
    // Limit to 19 characters (16 digits + 3 spaces)
    return formatted.slice(0, 19);
  };

  const formatExpiryDate = (text) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    
    // Add slash after 2 digits (MM/YY format)
    if (cleaned.length > 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    
    return cleaned;
  };

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      
      let paymentDetails;
      
      if (isAddingNew) {
        // Validate new card details
        if (!cardholderName || cardNumber.length < 19 || expiryDate.length < 5 || cvv.length < 3) {
          Alert.alert('Invalid Information', 'Please enter all card details correctly.');
          setIsLoading(false);
          return;
        }
        
        paymentDetails = {
          cardholderName,
          cardNumber: cardNumber.replace(/\s/g, ''),
          expiryDate,
          cvv,
          saveCard,
        };
      } else if (selectedPaymentMethod) {
        // Use selected payment method
        paymentDetails = {
          paymentMethodId: selectedPaymentMethod,
        };
      } else {
        Alert.alert('Payment Method Required', 'Please select a payment method or add a new card.');
        setIsLoading(false);
        return;
      }
      
      const result = await processPayment({
        ...paymentDetails,
        amount,
      });
      
      if (result.success) {
        onPaymentComplete(result);
        Alert.alert(
          'Payment Successful',
          `Your payment of $${amount} has been processed successfully.`,
          [{ text: 'OK', onPress: onClose }]
        );
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert(
        'Payment Failed',
        error.message || 'Unable to process payment. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderPaymentMethod = (method) => (
    <TouchableOpacity
      key={method.id}
      style={[
        styles.paymentMethodItem,
        selectedPaymentMethod === method.id && styles.selectedPaymentMethod
      ]}
      onPress={() => {
        setSelectedPaymentMethod(method.id);
        setIsAddingNew(false);
      }}
    >
      <View style={styles.cardIconContainer}>
        {method.brand === 'Visa' ? (
          <Ionicons name="card" size={24} color="#3498db" />
        ) : (
          <Ionicons name="card" size={24} color="#e74c3c" />
        )}
      </View>
      <View style={styles.cardDetails}>
        <Text style={styles.cardBrand}>{method.brand}</Text>
        <Text style={styles.cardNumber}>•••• •••• •••• {method.last4}</Text>
        <Text style={styles.cardExpiry}>
          Expires {method.expiryMonth}/{method.expiryYear}
        </Text>
      </View>
      {method.isDefault && (
        <View style={styles.defaultBadge}>
          <Text style={styles.defaultBadgeText}>Default</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Payment</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.scrollView}>
            <View style={styles.amountContainer}>
              <Text style={styles.amountLabel}>Total Amount</Text>
              <Text style={styles.amountValue}>${amount}</Text>
            </View>
            
            {isLoading && paymentMethods.length === 0 ? (
              <ActivityIndicator size="large" color="#3498db" style={styles.loader} />
            ) : (
              <>
                {paymentMethods.length > 0 && (
                  <View style={styles.savedCardsContainer}>
                    <Text style={styles.sectionTitle}>Saved Cards</Text>
                    {paymentMethods.map(renderPaymentMethod)}
                  </View>
                )}
                
                <TouchableOpacity
                  style={[
                    styles.addCardButton,
                    isAddingNew && styles.selectedPaymentMethod
                  ]}
                  onPress={() => {
                    setIsAddingNew(true);
                    setSelectedPaymentMethod(null);
                  }}
                >
                  <Ionicons name="add-circle" size={24} color="#3498db" />
                  <Text style={styles.addCardButtonText}>Add New Card</Text>
                </TouchableOpacity>
                
                {isAddingNew && (
                  <View style={styles.newCardForm}>
                    <Text style={styles.sectionTitle}>New Card Details</Text>
                    
                    <Text style={styles.inputLabel}>Cardholder Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="John Doe"
                      value={cardholderName}
                      onChangeText={setCardholderName}
                    />
                    
                    <Text style={styles.inputLabel}>Card Number</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                      keyboardType="numeric"
                      maxLength={19}
                    />
                    
                    <View style={styles.rowInputs}>
                      <View style={styles.halfInput}>
                        <Text style={styles.inputLabel}>Expiry Date</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="MM/YY"
                          value={expiryDate}
                          onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
                          keyboardType="numeric"
                          maxLength={5}
                        />
                      </View>
                      
                      <View style={styles.halfInput}>
                        <Text style={styles.inputLabel}>CVV</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="123"
                          value={cvv}
                          onChangeText={setCvv}
                          keyboardType="numeric"
                          maxLength={4}
                          secureTextEntry
                        />
                      </View>
                    </View>
                    
                    <View style={styles.saveCardContainer}>
                      <TouchableOpacity
                        style={styles.saveCardCheckbox}
                        onPress={() => setSaveCard(!saveCard)}
                      >
                        <Ionicons
                          name={saveCard ? "checkbox" : "square-outline"}
                          size={24}
                          color="#3498db"
                        />
                      </TouchableOpacity>
                      <Text style={styles.saveCardText}>Save card for future payments</Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>
          
          <TouchableOpacity 
            style={styles.payButton}
            onPress={handlePayment}
            disabled={isLoading || (!selectedPaymentMethod && !isAddingNew)}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.payButtonText}>Pay ${amount}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f1f2f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#7f8c8d',
    lineHeight: 24,
  },
  scrollView: {
    maxHeight: '75%',
  },
  amountContainer: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  loader: {
    marginVertical: 20,
  },
  savedCardsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f1f2f6',
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedPaymentMethod: {
    borderWidth: 2,
    borderColor: '#3498db',
  },
  cardIconContainer: {
    marginRight: 15,
  },
  cardDetails: {
    flex: 1,
  },
  cardBrand: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  cardNumber: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  cardExpiry: {
    fontSize: 12,
    color: '#95a5a6',
  },
  defaultBadge: {
    backgroundColor: '#3498db',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  addCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f1f2f6',
    borderRadius: 10,
    marginBottom: 20,
  },
  addCardButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#3498db',
    fontWeight: 'bold',
  },
  newCardForm: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  saveCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  saveCardCheckbox: {
    marginRight: 10,
  },
  saveCardText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  payButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  payButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PaymentForm;