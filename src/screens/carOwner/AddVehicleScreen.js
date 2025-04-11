import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { vehicleService } from '../../services/api';

const carTypes = ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Truck', 'Van'];
const transmissionTypes = ['Automatic', 'Manual'];
const fuelTypes = ['Gasoline', 'Diesel', 'Electric', 'Hybrid'];

const AddVehicleScreen = ({ navigation, route }) => {
  // Check if editing mode and get vehicle data from params
  const isEditing = route.params?.isEditing || false;
  const vehicleToEdit = route.params?.vehicle || null;

  // Vehicle details state
  const [make, setMake] = useState(isEditing ? vehicleToEdit.make : '');
  const [model, setModel] = useState(isEditing ? vehicleToEdit.model : '');
  const [year, setYear] = useState(isEditing ? vehicleToEdit.year.toString() : '');
  const [licensePlate, setLicensePlate] = useState(isEditing ? vehicleToEdit.licensePlate : '');
  const [selectedCarType, setSelectedCarType] = useState(isEditing ? vehicleToEdit.vehicleType : '');
  const [selectedTransmission, setSelectedTransmission] = useState(isEditing ? vehicleToEdit.transmission : '');
  const [selectedFuelType, setSelectedFuelType] = useState(isEditing ? vehicleToEdit.fuelType : '');
  const [seats, setSeats] = useState(isEditing ? vehicleToEdit.seats.toString() : '');
  
  // Pricing and availability state
  const [pricePerDay, setPricePerDay] = useState(isEditing ? vehicleToEdit.pricePerDay.toString() : '');
  const [isAvailable, setIsAvailable] = useState(isEditing ? vehicleToEdit.isAvailable : true);
  
  // Features state
  const [hasAC, setHasAC] = useState(isEditing ? vehicleToEdit.features.hasAC : true);
  const [hasGPS, setHasGPS] = useState(isEditing ? vehicleToEdit.features.hasGPS : false);
  const [hasBluetooth, setHasBluetooth] = useState(isEditing ? vehicleToEdit.features.hasBluetooth : true);
  const [hasUSB, setHasUSB] = useState(isEditing ? vehicleToEdit.features.hasUSB : true);
  const [hasChildSeat, setHasChildSeat] = useState(isEditing ? vehicleToEdit.features.hasChildSeat : false);
  
  // Location state
  const [location, setLocation] = useState(isEditing ? vehicleToEdit.location : '');
  
  // Additional info state
  const [description, setDescription] = useState(isEditing ? vehicleToEdit.description : '');
  
  // Submitting state
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validate required fields
    if (!make || !model || !year || !pricePerDay || !location) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      
      const vehicleData = {
        make,
        model,
        year: parseInt(year),
        licensePlate,
        vehicleType: selectedCarType || 'Sedan',
        transmission: selectedTransmission || 'Automatic',
        fuelType: selectedFuelType || 'Gasoline',
        seats: parseInt(seats) || 5,
        pricePerDay: parseFloat(pricePerDay),
        isAvailable,
        location,
        description,
        features: {
          hasAC,
          hasGPS,
          hasBluetooth,
          hasUSB,
          hasChildSeat,
        },
      };

      if (isEditing) {
        // Update existing vehicle
        await vehicleService.updateVehicle(vehicleToEdit._id, vehicleData);
        
        Alert.alert(
          'Success',
          'Vehicle has been updated successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('My Vehicles'),
            },
          ]
        );
      } else {
        // Add new vehicle
        await vehicleService.addVehicle(vehicleData);
        
        Alert.alert(
          'Success',
          'Vehicle has been added successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('My Vehicles'),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Vehicle operation error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to process vehicle data. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Selection helpers
  const renderSelectionItems = (items, selectedItem, onSelect) => {
    return (
      <View style={styles.selectionContainer}>
        {items.map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.selectionItem,
              selectedItem === item && styles.selectionItemSelected,
            ]}
            onPress={() => onSelect(item)}
          >
            <Text
              style={[
                styles.selectionItemText,
                selectedItem === item && styles.selectionItemTextSelected,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Vehicle' : 'Add a Vehicle'}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Details</Text>
          
          <Text style={styles.inputLabel}>Make<Text style={styles.requiredStar}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Toyota"
            value={make}
            onChangeText={setMake}
          />
          
          <Text style={styles.inputLabel}>Model<Text style={styles.requiredStar}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Camry"
            value={model}
            onChangeText={setModel}
          />
          
          <Text style={styles.inputLabel}>Year<Text style={styles.requiredStar}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 2022"
            value={year}
            onChangeText={setYear}
            keyboardType="numeric"
          />
          
          <Text style={styles.inputLabel}>License Plate</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., ABC123"
            value={licensePlate}
            onChangeText={setLicensePlate}
          />
          
          <Text style={styles.inputLabel}>Vehicle Type</Text>
          {renderSelectionItems(carTypes, selectedCarType, setSelectedCarType)}
          
          <Text style={styles.inputLabel}>Transmission</Text>
          {renderSelectionItems(transmissionTypes, selectedTransmission, setSelectedTransmission)}
          
          <Text style={styles.inputLabel}>Fuel Type</Text>
          {renderSelectionItems(fuelTypes, selectedFuelType, setSelectedFuelType)}
          
          <Text style={styles.inputLabel}>Number of Seats</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 5"
            value={seats}
            onChangeText={setSeats}
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing & Availability</Text>
          
          <Text style={styles.inputLabel}>Price per Day ($)<Text style={styles.requiredStar}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 50"
            value={pricePerDay}
            onChangeText={setPricePerDay}
            keyboardType="numeric"
          />
          
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Available for Rent</Text>
            <Switch
              value={isAvailable}
              onValueChange={setIsAvailable}
              trackColor={{ false: "#767577", true: "#c8f7d6" }}
              thumbColor={isAvailable ? "#2ecc71" : "#f4f3f4"}
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          
          <View style={styles.featuresContainer}>
            <View style={styles.featureRow}>
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Air Conditioning</Text>
                <Switch
                  value={hasAC}
                  onValueChange={setHasAC}
                  trackColor={{ false: "#767577", true: "#c8f7d6" }}
                  thumbColor={hasAC ? "#2ecc71" : "#f4f3f4"}
                />
              </View>
              
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>GPS Navigation</Text>
                <Switch
                  value={hasGPS}
                  onValueChange={setHasGPS}
                  trackColor={{ false: "#767577", true: "#c8f7d6" }}
                  thumbColor={hasGPS ? "#2ecc71" : "#f4f3f4"}
                />
              </View>
            </View>
            
            <View style={styles.featureRow}>
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Bluetooth</Text>
                <Switch
                  value={hasBluetooth}
                  onValueChange={setHasBluetooth}
                  trackColor={{ false: "#767577", true: "#c8f7d6" }}
                  thumbColor={hasBluetooth ? "#2ecc71" : "#f4f3f4"}
                />
              </View>
              
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>USB Port</Text>
                <Switch
                  value={hasUSB}
                  onValueChange={setHasUSB}
                  trackColor={{ false: "#767577", true: "#c8f7d6" }}
                  thumbColor={hasUSB ? "#2ecc71" : "#f4f3f4"}
                />
              </View>
            </View>
            
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Child Seat</Text>
              <Switch
                value={hasChildSeat}
                onValueChange={setHasChildSeat}
                trackColor={{ false: "#767577", true: "#c8f7d6" }}
                thumbColor={hasChildSeat ? "#2ecc71" : "#f4f3f4"}
              />
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          
          <Text style={styles.inputLabel}>Pickup Location<Text style={styles.requiredStar}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 123 Main St, City"
            value={location}
            onChangeText={setLocation}
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          
          <Text style={styles.inputLabel}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Provide additional details about your vehicle..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>
        
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={submitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEditing ? 'Update Vehicle' : 'Add Vehicle'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#2ecc71',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    padding: 15,
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
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
    color: '#2c3e50',
    marginBottom: 8,
  },
  requiredStar: {
    color: '#e74c3c',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  selectionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  selectionItem: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    margin: 5,
  },
  selectionItemSelected: {
    backgroundColor: '#c8f7d6',
    borderColor: '#2ecc71',
  },
  selectionItemText: {
    color: '#7f8c8d',
  },
  selectionItemTextSelected: {
    color: '#2ecc71',
    fontWeight: 'bold',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  switchLabel: {
    fontSize: 16,
    color: '#2c3e50',
  },
  featuresContainer: {
    marginBottom: 10,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#2ecc71',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#2ecc71',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#2ecc71',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddVehicleScreen;