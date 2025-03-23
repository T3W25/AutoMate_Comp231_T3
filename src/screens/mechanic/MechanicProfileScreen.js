import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MechanicProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Profile form state
  const [serviceName, setServiceName] = useState('');
  const [description, setDescription] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [location, setLocation] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [workingStart, setWorkingStart] = useState('09:00');
  const [workingEnd, setWorkingEnd] = useState('18:00');
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  
  // Days availability state
  const [daysAvailable, setDaysAvailable] = useState({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: true,
    sunday: false,
  });

  // Specialization options
  const specializationOptions = [
    'General Repair',
    'Engine Specialist',
    'Transmission Specialist',
    'Brake Specialist',
    'Electrical Systems',
    'Body Work',
    'Tire Specialist',
    'Oil Change',
    'Diagnostics',
  ];

  useEffect(() => {
    loadUserData();
    loadMechanicProfile();
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

  const loadMechanicProfile = async () => {
    try {
      // In a real app, you would fetch the mechanic profile from API
      // For now, using mock data to simulate
      setTimeout(() => {
        // Simulate an existing profile
        const mockProfile = {
          serviceName: 'Smith Auto Repairs',
          description: 'Providing quality auto repair services with over 10 years of experience. Specialized in engine diagnostics and repairs.',
          hourlyRate: 75,
          specialization: 'Engine Specialist',
          location: '123 Main St, Anytown, USA',
          isAvailable: true,
          workingHours: {
            start: '09:00',
            end: '18:00'
          },
          daysAvailable: {
            monday: true,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: true,
            saturday: true,
            sunday: false,
          }
        };

        setServiceName(mockProfile.serviceName);
        setDescription(mockProfile.description);
        setHourlyRate(mockProfile.hourlyRate.toString());
        setSpecialization(mockProfile.specialization);
        setLocation(mockProfile.location);
        setIsAvailable(mockProfile.isAvailable);
        setWorkingStart(mockProfile.workingHours.start);
        setWorkingEnd(mockProfile.workingHours.end);
        setDaysAvailable(mockProfile.daysAvailable);
        setIsProfileComplete(true);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading mechanic profile:', error);
      setLoading(false);
    }
  };

  const toggleDay = (day) => {
    setDaysAvailable({
      ...daysAvailable,
      [day]: !daysAvailable[day]
    });
  };

  const handleSaveProfile = async () => {
    // Validate form
    if (!serviceName) {
      Alert.alert('Error', 'Please enter a service name.');
      return;
    }

    if (!hourlyRate) {
      Alert.alert('Error', 'Please enter your hourly rate.');
      return;
    }

    if (!specialization) {
      Alert.alert('Error', 'Please select your specialization.');
      return;
    }

    if (!location) {
      Alert.alert('Error', 'Please enter your location.');
      return;
    }

    try {
      setSubmitting(true);

      // In a real app, you would send the profile data to API
      // For now, simulate a success response
      setTimeout(() => {
        setSubmitting(false);
        setIsProfileComplete(true);
        Alert.alert(
          'Profile Saved',
          'Your mechanic profile has been updated successfully.'
        );
      }, 1500);
    } catch (error) {
      console.error('Error saving profile:', error);
      setSubmitting(false);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };
  
  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userToken');
              await AsyncStorage.removeItem('userData');
              
              // Navigate back to the auth flow
              navigation.reset({
                index: 0,
                routes: [{ name: 'RoleSelect' }],
              });
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e74c3c" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mechanic Profile</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.profileImagePlaceholder}>
            <Ionicons name="person" size={60} color="#bdc3c7" />
          </View>
          
          <Text style={styles.userName}>{userData?.name}</Text>
          <Text style={styles.userRole}>Mechanic</Text>
          
          <TouchableOpacity style={styles.uploadButton}>
            <Text style={styles.uploadButtonText}>Upload Photo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Business Information</Text>
          
          <Text style={styles.inputLabel}>Service Name <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Smith Auto Repairs"
            value={serviceName}
            onChangeText={setServiceName}
          />
          
          <Text style={styles.inputLabel}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your services and experience..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
          
          <Text style={styles.inputLabel}>Hourly Rate ($) <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 75"
            value={hourlyRate}
            onChangeText={setHourlyRate}
            keyboardType="numeric"
          />
          
          <Text style={styles.inputLabel}>Specialization <Text style={styles.required}>*</Text></Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.specializationContainer}
          >
            {specializationOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.specializationOption,
                  specialization === option && styles.selectedSpecialization
                ]}
                onPress={() => setSpecialization(option)}
              >
                <Text
                  style={[
                    styles.specializationText,
                    specialization === option && styles.selectedSpecializationText
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <Text style={styles.inputLabel}>Location <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Your business address"
            value={location}
            onChangeText={setLocation}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Availability</Text>
          
          <View style={styles.availabilityToggle}>
            <Text style={styles.availabilityLabel}>Available for new jobs</Text>
            <Switch
              value={isAvailable}
              onValueChange={setIsAvailable}
              trackColor={{ false: "#767577", true: "#f8d7da" }}
              thumbColor={isAvailable ? "#e74c3c" : "#f4f3f4"}
            />
          </View>
          
          <Text style={styles.inputLabel}>Working Hours</Text>
          <View style={styles.workingHoursContainer}>
            <View style={styles.timeInput}>
              <Text style={styles.timeLabel}>From</Text>
              <TextInput
                style={styles.timeField}
                placeholder="09:00"
                value={workingStart}
                onChangeText={setWorkingStart}
              />
            </View>
            
            <Text style={styles.timeSeparator}>to</Text>
            
            <View style={styles.timeInput}>
              <Text style={styles.timeLabel}>To</Text>
              <TextInput
                style={styles.timeField}
                placeholder="18:00"
                value={workingEnd}
                onChangeText={setWorkingEnd}
              />
            </View>
          </View>
          
          <Text style={styles.inputLabel}>Days Available</Text>
          <View style={styles.daysContainer}>
            {Object.entries(daysAvailable).map(([day, isActive]) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayOption,
                  isActive && styles.activeDayOption
                ]}
                onPress={() => toggleDay(day)}
              >
                <Text
                  style={[
                    styles.dayText,
                    isActive && styles.activeDayText
                  ]}
                >
                  {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveProfile}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isProfileComplete ? 'Update Profile' : 'Complete Profile'}
            </Text>
          )}
        </TouchableOpacity>
        
        {/* Add logout button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out" size={20} color="white" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#e74c3c',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    padding: 15,
  },
  profileSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#f1f2f6',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  userRole: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 15,
  },
  uploadButton: {
    backgroundColor: '#fadbd8',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  uploadButtonText: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  formSection: {
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
    color: '#7f8c8d',
    marginBottom: 8,
  },
  required: {
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
  specializationContainer: {
    marginBottom: 15,
  },
  specializationOption: {
    backgroundColor: '#f1f2f6',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  selectedSpecialization: {
    backgroundColor: '#fadbd8',
  },
  specializationText: {
    color: '#7f8c8d',
  },
  selectedSpecializationText: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  availabilityToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfe6e9',
  },
  availabilityLabel: {
    fontSize: 16,
    color: '#2c3e50',
  },
  workingHoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  timeInput: {
    flex: 2,
  },
  timeLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  timeField: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  timeSeparator: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 20,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  dayOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f2f6',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
  },
  activeDayOption: {
    backgroundColor: '#fadbd8',
  },
  dayText: {
    color: '#7f8c8d',
    fontWeight: 'bold',
  },
  activeDayText: {
    color: '#e74c3c',
  },
  saveButton: {
    backgroundColor: '#e74c3c',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#95a5a6',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 30,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default MechanicProfileScreen;