import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mechanicService } from '../../services/api';
import { getCurrentLocation } from '../../utils/locationService';

const ServiceRequestScreen = ({ route, navigation }) => {
  const { mechanic, userLocation } = route.params || { 
    mechanic: { name: 'Mechanic', specialization: 'General Repair' },
    userLocation: null
  };
  
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  
  // Request form state
  const [vehicleType, setVehicleType] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [location, setLocation] = useState(userLocation ? 'current' : 'other');
  const [address, setAddress] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);

  // Date picker state
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedHour, setSelectedHour] = useState(new Date().getHours());
  const [selectedMinute, setSelectedMinute] = useState(new Date().getMinutes());

  // Service types
  const serviceTypes = [
    'Engine Repair',
    'Oil Change',
    'Brake Service',
    'Battery Replacement',
    'Tire Change',
    'Diagnostic',
    'Other'
  ];

  // Vehicle types
  const vehicleTypes = [
    'Sedan',
    'SUV',
    'Hatchback',
    'Truck',
    'Van',
    'Coupe',
    'Other'
  ];

  useEffect(() => {
    loadUserData();
    
    // If no userLocation provided, try to get current location
    if (!userLocation) {
      initializeLocation();
    }
  }, []);

  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        setUserData(JSON.parse(userDataString));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const initializeLocation = async () => {
    try {
      const location = await getCurrentLocation();
      if (location) {
        // We have location, use 'current' option
        setLocation('current');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      // Default to 'other' if we can't get location
      setLocation('other');
    }
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const hideDatePickerModal = () => {
    setShowDatePicker(false);
  };

  const showTimePickerModal = () => {
    setShowTimePicker(true);
  };

  const hideTimePickerModal = () => {
    setShowTimePicker(false);
  };

  const confirmDate = () => {
    const newDate = new Date(selectedYear, selectedMonth, selectedDay);
    setDate(newDate);
    hideDatePickerModal();
  };

  const confirmTime = () => {
    const newTime = new Date();
    newTime.setHours(selectedHour);
    newTime.setMinutes(selectedMinute);
    setTime(newTime);
    hideTimePickerModal();
  };

  const formatDate = (date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const formatTime = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesString = minutes < 10 ? `0${minutes}` : minutes;
    return `${hours}:${minutesString} ${ampm}`;
  };

  const handleSubmit = async () => {
    // Validate form
    if (!vehicleType) {
      Alert.alert('Error', 'Please select a vehicle type.');
      return;
    }

    if (!serviceType) {
      Alert.alert('Error', 'Please select a service type.');
      return;
    }

    if (!description) {
      Alert.alert('Error', 'Please provide a description of the issue.');
      return;
    }

    if (location === 'other' && !address) {
      Alert.alert('Error', 'Please provide an address for the service.');
      return;
    }

    try {
      setLoading(true);

      if (!userData) {
        Alert.alert('Error', 'You must be logged in to request a service');
        setLoading(false);
        return;
      }

      // Create scheduled date by combining date and time
      const scheduledDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        time.getHours(),
        time.getMinutes()
      );

      // Prepare service request data
      const serviceRequestData = {
        mechanicId: mechanic.id,
        customerId: userData._id,
        customerName: userData.name,
        vehicleType,
        serviceType,
        description,
        isEmergency,
        scheduledDate: scheduledDate.toISOString(),
        location: location === 'current' ? 'Current Location' : address,
      };

      // Create the service request
      const result = await createServiceRequest(serviceRequestData);

      if (result) {
        Alert.alert(
          'Service Request Sent',
          `Your service request has been sent to ${mechanic.name}. You will be notified when they respond.`,
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Find Mechanic'),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error submitting service request:', error);
      Alert.alert('Error', 'Failed to submit service request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to create a service request and store it locally
  const createServiceRequest = async (requestData) => {
    // Try to use the API service first
    try {
      const response = await mechanicService.createServiceRequest(requestData);
      return response;
    } catch (error) {
      console.error('API error creating service request:', error);
      
      // If API fails, use local storage as fallback
      try {
        const serviceRequest = {
          id: Date.now().toString(),
          status: 'pending',
          ...requestData,
          createdAt: new Date().toISOString(),
        };
        
        // Store in mechanic's requests
        const mechanicRequestsKey = `serviceRequests_${requestData.mechanicId}`;
        let mechanicRequests = [];
        const mechanicRequestsStr = await AsyncStorage.getItem(mechanicRequestsKey);
        
        if (mechanicRequestsStr) {
          mechanicRequests = JSON.parse(mechanicRequestsStr);
        }
        
        mechanicRequests.push(serviceRequest);
        await AsyncStorage.setItem(mechanicRequestsKey, JSON.stringify(mechanicRequests));
        
        // Store in user's requests
        const userRequestsKey = `userServiceRequests_${requestData.customerId}`;
        let userRequests = [];
        const userRequestsStr = await AsyncStorage.getItem(userRequestsKey);
        
        if (userRequestsStr) {
          userRequests = JSON.parse(userRequestsStr);
        }
        
        userRequests.push(serviceRequest);
        await AsyncStorage.setItem(userRequestsKey, JSON.stringify(userRequests));
        
        return serviceRequest;
      } catch (storageError) {
        console.error('Error storing service request locally:', storageError);
        throw new Error('Failed to create service request');
      }
    }
  };

  const renderDayOptions = () => {
    const days = [];
    // Get number of days in the selected month
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(
        <TouchableOpacity
          key={`day-${i}`}
          style={[
            styles.pickerItem,
            selectedDay === i && styles.selectedPickerItem
          ]}
          onPress={() => setSelectedDay(i)}
        >
          <Text
            style={[
              styles.pickerItemText,
              selectedDay === i && styles.selectedPickerItemText
            ]}
          >
            {i}
          </Text>
        </TouchableOpacity>
      );
    }
    return days;
  };

  const renderMonthOptions = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month, index) => (
      <TouchableOpacity
        key={`month-${index}`}
        style={[
          styles.pickerItem,
          selectedMonth === index && styles.selectedPickerItem
        ]}
        onPress={() => setSelectedMonth(index)}
      >
        <Text
          style={[
            styles.pickerItemText,
            selectedMonth === index && styles.selectedPickerItemText
          ]}
        >
          {month}
        </Text>
      </TouchableOpacity>
    ));
  };

  const renderYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [currentYear, currentYear + 1];
    return years.map(year => (
      <TouchableOpacity
        key={`year-${year}`}
        style={[
          styles.pickerItem,
          selectedYear === year && styles.selectedPickerItem
        ]}
        onPress={() => setSelectedYear(year)}
      >
        <Text
          style={[
            styles.pickerItemText,
            selectedYear === year && styles.selectedPickerItemText
          ]}
        >
          {year}
        </Text>
      </TouchableOpacity>
    ));
  };

  const renderHourOptions = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      let displayHour = i % 12;
      displayHour = displayHour === 0 ? 12 : displayHour;
      const ampm = i < 12 ? 'AM' : 'PM';
      hours.push(
        <TouchableOpacity
          key={`hour-${i}`}
          style={[
            styles.pickerItem,
            selectedHour === i && styles.selectedPickerItem
          ]}
          onPress={() => setSelectedHour(i)}
        >
          <Text
            style={[
              styles.pickerItemText,
              selectedHour === i && styles.selectedPickerItemText
            ]}
          >
            {displayHour} {ampm}
          </Text>
        </TouchableOpacity>
      );
    }
    return hours;
  };

  const renderMinuteOptions = () => {
    const minutes = [];
    for (let i = 0; i < 60; i += 5) {
      minutes.push(
        <TouchableOpacity
          key={`minute-${i}`}
          style={[
            styles.pickerItem,
            selectedMinute === i && styles.selectedPickerItem
          ]}
          onPress={() => setSelectedMinute(i)}
        >
          <Text
            style={[
              styles.pickerItemText,
              selectedMinute === i && styles.selectedPickerItemText
            ]}
          >
            {i < 10 ? `0${i}` : i}
          </Text>
        </TouchableOpacity>
      );
    }
    return minutes;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Service</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.mechanicCard}>
          <View style={styles.mechanicProfile}>
            <View style={styles.mechanicImagePlaceholder}>
              <Ionicons name="person" size={30} color="#bdc3c7" />
            </View>
            <View style={styles.mechanicInfo}>
              <Text style={styles.mechanicName}>{mechanic.name}</Text>
              <Text style={styles.mechanicSpecialization}>{mechanic.specialization}</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={14} color="#f39c12" />
                <Text style={styles.ratingText}>{mechanic.rating}</Text>
              </View>
            </View>
            <Text style={styles.rateText}>${mechanic.hourlyRate}/hr</Text>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Service Details</Text>

          <Text style={styles.inputLabel}>Vehicle Type</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.optionsScroll}
          >
            {vehicleTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.optionButton,
                  vehicleType === type && styles.optionButtonSelected,
                ]}
                onPress={() => setVehicleType(type)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    vehicleType === type && styles.optionButtonTextSelected,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.inputLabel}>Service Type</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.optionsScroll}
          >
            {serviceTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.optionButton,
                  serviceType === type && styles.optionButtonSelected,
                ]}
                onPress={() => setServiceType(type)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    serviceType === type && styles.optionButtonTextSelected,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.inputLabel}>Description of the Issue</Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Describe the issue with your vehicle..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />

          <View style={styles.emergencyContainer}>
            <Text style={styles.emergencyLabel}>This is an emergency</Text>
            <Switch
              value={isEmergency}
              onValueChange={setIsEmergency}
              trackColor={{ false: "#767577", true: "#facfd9" }}
              thumbColor={isEmergency ? "#e74c3c" : "#f4f3f4"}
            />
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Schedule</Text>

          <Text style={styles.inputLabel}>Date</Text>
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={showDatePickerModal}
          >
            <Ionicons name="calendar" size={20} color="#3498db" />
            <Text style={styles.dateTimeText}>
              {formatDate(date)}
            </Text>
          </TouchableOpacity>

          <Text style={styles.inputLabel}>Time</Text>
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={showTimePickerModal}
          >
            <Ionicons name="time" size={20} color="#3498db" />
            <Text style={styles.dateTimeText}>
              {formatTime(time)}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Location</Text>

          <View style={styles.locationOptions}>
            <TouchableOpacity
              style={[
                styles.locationOption,
                location === 'current' && styles.locationOptionSelected,
              ]}
              onPress={() => setLocation('current')}
            >
              <Ionicons
                name={location === 'current' ? "radio-button-on" : "radio-button-off"}
                size={20}
                color={location === 'current' ? "#3498db" : "#7f8c8d"}
              />
              <Text style={styles.locationText}>My Current Location</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.locationOption,
                location === 'other' && styles.locationOptionSelected,
              ]}
              onPress={() => setLocation('other')}
            >
              <Ionicons
                name={location === 'other' ? "radio-button-on" : "radio-button-off"}
                size={20}
                color={location === 'other' ? "#3498db" : "#7f8c8d"}
              />
              <Text style={styles.locationText}>Different Location</Text>
            </TouchableOpacity>
          </View>

          {location === 'other' && (
            <TextInput
              style={styles.addressInput}
              placeholder="Enter address for service"
              value={address}
              onChangeText={setAddress}
            />
          )}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <Text style={styles.photoHelp}>
            Image upload will be available in a future update.
          </Text>
          
          <TouchableOpacity 
            style={styles.photoButtonDisabled}
            onPress={() => Alert.alert("Coming Soon", "Image upload will be available in a future update.")}
          >
            <Ionicons name="images" size={40} color="#bdc3c7" />
            <Text style={styles.photoButtonText}>Add Photos</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Send Service Request</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Custom Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Date</Text>
            
            <View style={styles.pickerContainer}>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Day</Text>
                <ScrollView style={styles.picker}>
                  {renderDayOptions()}
                </ScrollView>
              </View>
              
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Month</Text>
                <ScrollView style={styles.picker}>
                  {renderMonthOptions()}
                </ScrollView>
              </View>
              
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Year</Text>
                <ScrollView style={styles.picker}>
                  {renderYearOptions()}
                </ScrollView>
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={hideDatePickerModal}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmDate}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Time</Text>
            
            <View style={styles.pickerContainer}>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Hour</Text>
                <ScrollView style={styles.picker}>
                  {renderHourOptions()}
                </ScrollView>
              </View>
              
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Minute</Text>
                <ScrollView style={styles.picker}>
                  {renderMinuteOptions()}
                </ScrollView>
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={hideTimePickerModal}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmTime}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#3498db',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 15,
  },
  content: {
    padding: 15,
  },
  mechanicCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mechanicProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mechanicImagePlaceholder: {
    width: 50,
    height: 50,
    backgroundColor: '#f1f2f6',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mechanicInfo: {
    flex: 1,
    marginLeft: 15,
  },
  mechanicName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  mechanicSpecialization: {
    fontSize: 14,
    color: '#3498db',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 5,
    color: '#7f8c8d',
    fontSize: 14,
  },
  rateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  formSection: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 10,
  },
  optionsScroll: {
    marginBottom: 15,
  },
  optionButton: {
    backgroundColor: '#f1f2f6',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  optionButtonSelected: {
    backgroundColor: '#e3f2fd',
  },
  optionButtonText: {
    color: '#7f8c8d',
  },
  optionButtonTextSelected: {
    color: '#3498db',
    fontWeight: 'bold',
  },
  descriptionInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  emergencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#ffeaea',
    borderRadius: 8,
  },
  emergencyLabel: {
    fontSize: 16,
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 10,
  },
  locationOptions: {
    marginBottom: 15,
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationOptionSelected: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 8,
  },
  locationText: {
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 10,
  },
  addressInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  photoHelp: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 15,
  },
  photoButtonDisabled: {
    width: '100%',
    height: 100,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  photoButtonText: {
    marginTop: 10,
    color: '#95a5a6',
  },
  submitButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    textAlign: 'center',
  },
  pickerContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  picker: {
    height: 150,
    width: '100%',
  },
  pickerItem: {
    padding: 10,
    alignItems: 'center',
  },
  selectedPickerItem: {
    backgroundColor: '#e3f2fd',
    borderRadius: 5,
  },
  pickerItemText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  selectedPickerItemText: {
    fontWeight: 'bold',
    color: '#3498db',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 5,
    marginHorizontal: 5,
  },
  confirmButton: {
    backgroundColor: '#3498db',
  },
  modalButtonText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  confirmButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ServiceRequestScreen;