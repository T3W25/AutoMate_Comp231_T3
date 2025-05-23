import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import moment from 'moment';
import { bookingService } from '../services/api';
import PaymentForm from './PaymentForm';

const BookingCalendar = ({ vehicle, onClose, onBookingComplete }) => {
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [markedDates, setMarkedDates] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [totalPrice, setTotalPrice] = useState(0);
  const [existingBookings, setExistingBookings] = useState([]);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    loadExistingBookings();
  }, []);

  useEffect(() => {
    calculateTotalPrice();
    updateMarkedDates();
  }, [selectedStartDate, selectedEndDate, existingBookings]);

  const loadExistingBookings = async () => {
    try {
      setLoadingBookings(true);
  
      const response = await fetch(`http://192.168.2.15:5000/api/bookings/vehicle/${vehicle._id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      
      const bookings = await response.json();
      
  
      const formattedBookings = bookings.map(booking => ({
        startDate: moment(booking.startDate).format('YYYY-MM-DD'),
        endDate: moment(booking.endDate).format('YYYY-MM-DD'),
      }));
      
      setExistingBookings(formattedBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
  
      setExistingBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  const updateMarkedDates = () => {
    const marked = {};
    
  
    existingBookings.forEach(booking => {
      const start = moment(booking.startDate);
      const end = moment(booking.endDate);
      
      for (let m = moment(start); m.diff(end, 'days') <= 0; m.add(1, 'days')) {
        const dateString = m.format('YYYY-MM-DD');
        marked[dateString] = { 
          disabled: true, 
          disableTouchEvent: true,
          textColor: '#ccc',
          dotColor: '#e74c3c',
          marked: true
        };
      }
    });
    
  
    if (selectedStartDate) {
      marked[selectedStartDate] = {
        selected: true,
        startingDay: true,
        color: '#3498db',
        textColor: 'white'
      };
      
      if (selectedEndDate) {
        marked[selectedEndDate] = {
          selected: true,
          endingDay: true,
          color: '#3498db',
          textColor: 'white'
        };
        
  
        const start = moment(selectedStartDate);
        const end = moment(selectedEndDate);
        
        for (let m = moment(start).add(1, 'days'); m.diff(end, 'days') < 0; m.add(1, 'days')) {
          const dateString = m.format('YYYY-MM-DD');
          if (!marked[dateString]?.disabled) {
            marked[dateString] = { 
              selected: true, 
              color: '#3498db',
              textColor: 'white'
            };
          }
        }
      }
    }
    
    setMarkedDates(marked);
  };

  const isDateUnavailable = (dateString) => {
    return Boolean(markedDates[dateString]?.disabled);
  };

  const handleDayPress = (day) => {
    const dateString = day.dateString;
    
  
    if (moment(dateString).isBefore(moment(), 'day')) {
      return;
    }
    
  
    if (isDateUnavailable(dateString)) {
      return;
    }
    
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
  
      setSelectedStartDate(dateString);
      setSelectedEndDate(null);
    } else {
  
      if (moment(dateString).isBefore(moment(selectedStartDate))) {
  
        setSelectedEndDate(selectedStartDate);
        setSelectedStartDate(dateString);
      } else {
  
        const start = moment(selectedStartDate);
        const end = moment(dateString);
        
        let hasUnavailableDate = false;
        for (let m = moment(start); m.diff(end, 'days') <= 0; m.add(1, 'days')) {
          const date = m.format('YYYY-MM-DD');
          if (isDateUnavailable(date)) {
            hasUnavailableDate = true;
            break;
          }
        }
        
        if (hasUnavailableDate) {
          Alert.alert(
            'Unavailable Dates',
            'Your selected range includes dates that are already booked. Please select a different range.'
          );
          return;
        }
        
        setSelectedEndDate(dateString);
      }
    }
  };

  const calculateTotalPrice = () => {
    if (selectedStartDate && selectedEndDate) {
      const start = moment(selectedStartDate);
      const end = moment(selectedEndDate);
      const days = end.diff(start, 'days') + 1;
      setTotalPrice(days * vehicle.pricePerDay);
    } else {
      setTotalPrice(0);
    }
  };

  const handleCreateBooking = async () => {
    if (!selectedStartDate || !selectedEndDate) {
      Alert.alert('Error', 'Please select both start and end dates.');
      return;
    }
    
  
    setShowPayment(true);
  };

  const handlePaymentComplete = async (paymentResult) => {
    try {
      setIsLoading(true);
      
      const bookingData = {
        vehicleId: vehicle._id,
        startDate: selectedStartDate,
        endDate: selectedEndDate,
        notes: '',
        paymentId: paymentResult.transactionId,
      };
      
  
      const booking = await bookingService.createBooking(bookingData);
      
      setIsLoading(false);
      onBookingComplete(booking);
      Alert.alert(
        'Booking Successful',
        `Your booking for ${vehicle.make} ${vehicle.model} has been confirmed.`,
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      console.error('Error creating booking:', error);
      setIsLoading(false);
      Alert.alert(
        'Booking Failed',
        error.response?.data?.message || 'Unable to create booking. Please try again.'
      );
    }
  };

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
            <Text style={styles.title}>Book This Vehicle</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName}>{vehicle.make} {vehicle.model} ({vehicle.year})</Text>
              <Text style={styles.priceText}>${vehicle.pricePerDay}/day</Text>
            </View>
            
            <Text style={styles.sectionTitle}>Select Dates</Text>
            
            <View style={styles.dateDisplay}>
              <View style={styles.dateBox}>
                <Text style={styles.dateLabel}>Start Date</Text>
                <Text style={styles.dateValue}>
                  {selectedStartDate ? moment(selectedStartDate).format('MMM DD, YYYY') : 'Select date'}
                </Text>
              </View>
              
              <View style={styles.dateArrow}>
                <Text>→</Text>
              </View>
              
              <View style={styles.dateBox}>
                <Text style={styles.dateLabel}>End Date</Text>
                <Text style={styles.dateValue}>
                  {selectedEndDate ? moment(selectedEndDate).format('MMM DD, YYYY') : 'Select date'}
                </Text>
              </View>
            </View>
            
            {loadingBookings ? (
              <View style={styles.calendarLoading}>
                <ActivityIndicator size="large" color="#3498db" />
                <Text style={styles.loadingText}>Loading availability...</Text>
              </View>
            ) : (
              <Calendar
                markedDates={markedDates}
                onDayPress={handleDayPress}
                markingType="period"
                minDate={moment().format('YYYY-MM-DD')}
                theme={{
                  todayTextColor: '#3498db',
                  selectedDayBackgroundColor: '#3498db',
                  selectedDayTextColor: 'white',
                  arrowColor: '#3498db',
                  monthTextColor: '#2c3e50',
                  textMonthFontWeight: 'bold',
                  textDayFontSize: 16,
                  textMonthFontSize: 16,
                  textDayHeaderFontSize: 14
                }}
              />
            )}
            
            {selectedStartDate && selectedEndDate && (
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Booking Summary</Text>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Duration:</Text>
                  <Text style={styles.summaryValue}>
                    {moment(selectedEndDate).diff(moment(selectedStartDate), 'days') + 1} days
                  </Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Daily Rate:</Text>
                  <Text style={styles.summaryValue}>${vehicle.pricePerDay}</Text>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.summaryRow}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalValue}>${totalPrice}</Text>
                </View>
              </View>
            )}
            

            <View style={styles.bottomSpace} />
          </ScrollView>
          
          <TouchableOpacity 
            style={[
              styles.bookButton,
              (!selectedStartDate || !selectedEndDate) && styles.disabledButton
            ]}
            onPress={handleCreateBooking}
            disabled={!selectedStartDate || !selectedEndDate || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.bookButtonText}>Request Booking</Text>
            )}
          </TouchableOpacity>
          
          {showPayment && (
            <PaymentForm
              amount={totalPrice}
              onClose={() => setShowPayment(false)}
              onPaymentComplete={handlePaymentComplete}
            />
          )}
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
    paddingBottom: 80, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scrollView: {
    width: '100%',
    flexGrow: 1,
  },
  scrollViewContent: {
    paddingBottom: 20, 
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
  vehicleInfo: {
    marginBottom: 20,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  priceText: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  dateDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateBox: {
    flex: 1,
    backgroundColor: '#f1f2f6',
    padding: 10,
    borderRadius: 5,
  },
  dateLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  dateValue: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: 'bold',
  },
  dateArrow: {
    paddingHorizontal: 10,
  },
  calendarLoading: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#7f8c8d',
    fontSize: 14,
  },
  summaryContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  summaryValue: {
    fontSize: 16,
    color: '#2c3e50',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3498db',
  },
  bookButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  disabledButton: {
    backgroundColor: '#b2c1d0',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomSpace: {
    height: 60,
  },
});

export default BookingCalendar;