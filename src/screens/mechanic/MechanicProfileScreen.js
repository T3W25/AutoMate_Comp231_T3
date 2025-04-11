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
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { mechanicService } from '../../services/api';

const MechanicProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Profile form state
  const [serviceName, setServiceName] = useState('');
  const [description, setDescription] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [specialization, setSpecialization] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [location, setLocation] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [workingStart, setWorkingStart] = useState('09:00');
  const [workingEnd, setWorkingEnd] = useState('18:00');
  const [profileImage, setProfileImage] = useState(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [experienceYears, setExperienceYears] = useState('');
  const [experienceDescription, setExperienceDescription] = useState('');
  
  // New location preferences state
  const [shareLocation, setShareLocation] = useState(false);
  const [officeAddress, setOfficeAddress] = useState('');
  
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
    (async () => {
      // Request camera roll permissions
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Sorry, we need camera roll permissions to make this work!');
        }
      }
    })();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        setUserData(userData);

        // Try to load mechanic profile from AsyncStorage
        const mechanicProfileStr = await AsyncStorage.getItem(`mechanicProfile_${userData._id}`);
        if (mechanicProfileStr) {
          const mechanicProfile = JSON.parse(mechanicProfileStr);
          
          // Populate form fields with stored data
          setServiceName(mechanicProfile.serviceName || '');
          setDescription(mechanicProfile.description || '');
          setHourlyRate(mechanicProfile.hourlyRate ? mechanicProfile.hourlyRate.toString() : '');
          setSpecialization(mechanicProfile.specialization || []);
          setCertifications(mechanicProfile.certifications || []);
          setLocation(mechanicProfile.location || '');
          setIsAvailable(mechanicProfile.isAvailable !== undefined ? mechanicProfile.isAvailable : true);
          setWorkingStart(mechanicProfile.workingHours?.start || '09:00');
          setWorkingEnd(mechanicProfile.workingHours?.end || '18:00');
          setShareLocation(mechanicProfile.shareLocation || false);
          setOfficeAddress(mechanicProfile.officeAddress || '');
          setProfileImage(mechanicProfile.profileImage || null);
          
          // Update days available if stored
          if (mechanicProfile.daysAvailable) {
            setDaysAvailable(mechanicProfile.daysAvailable);
          }

          // Mark profile as complete if key fields are filled
          setIsProfileComplete(
            !!serviceName && 
            !!hourlyRate && 
            !!location && 
            specialization.length > 0
          );
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      // Request permissions if not already granted
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Sorry, we need camera roll permissions to make this work!');
        return;
      }

      // Launch image picker
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Use this instead of [ImagePicker.MediaType.Images]
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedImage = result.assets[0].uri;
        
        // Optional: Add image size validation
        const fileInfo = await FileSystem.getInfoAsync(selectedImage);
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        if (fileInfo.size > maxSize) {
          Alert.alert('File Too Large', 'Please select an image under 5MB');
          return;
        }

        setProfileImage(selectedImage);
        
        // Update user data in AsyncStorage
        if (userData) {
          const userDataCopy = {...userData, profileImage: selectedImage};
          await AsyncStorage.setItem('userData', JSON.stringify(userDataCopy));
        }

        Alert.alert('Success', 'Profile picture updated successfully');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };



  const loadMechanicProfile = async () => {
    try {
      setLoading(true);
      
      // First try to get from userData.mechanicProfile if it exists
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const user = JSON.parse(userDataString);
        if (user.mechanicProfile) {
          // User already has mechanic profile data
          setSpecialization(user.mechanicProfile.specialization || '');
          setHourlyRate(user.mechanicProfile.hourlyRate?.toString() || '');
          setLocation(user.mechanicProfile.location || '');
          setShareLocation(user.mechanicProfile.shareLocation || false);
          setOfficeAddress(user.mechanicProfile.officeAddress || '');
          setIsProfileComplete(true);
        }
      }
      
      // Then try to get from registeredMechanics
      const mechanicsStr = await AsyncStorage.getItem('registeredMechanics');
      if (mechanicsStr && userData) {
        const mechanics = JSON.parse(mechanicsStr);
        const mechanic = mechanics.find(m => m.id === userData._id);
        
        if (mechanic) {
          setServiceName(mechanic.serviceName || `${userData.name}'s Repair Service`);
          setDescription(mechanic.description || 'Professional auto repair services');
          setHourlyRate(mechanic.hourlyRate.toString());
          setSpecialization(mechanic.specialization);
          setLocation(mechanic.location || '');
          setIsAvailable(mechanic.available !== undefined ? mechanic.available : true);
          setShareLocation(mechanic.shareLocation || false);
          setOfficeAddress(mechanic.officeAddress || '');
          
          // Set working hours if available
          if (mechanic.workingHours) {
            setWorkingStart(mechanic.workingHours.start || '09:00');
            setWorkingEnd(mechanic.workingHours.end || '18:00');
          }
          
          // Set days availability if available
          if (mechanic.daysAvailable) {
            setDaysAvailable(mechanic.daysAvailable);
          }
          
          setIsProfileComplete(true);
        }
      }
      
      setLoading(false);
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

  const toggleSpecialization = (option) => {
    setSpecialization(prev => 
      prev.includes(option) 
        ? prev.filter(item => item !== option)
        : [...prev, option]
    );
  };

  const handleSaveProfile = async () => {
    try {
      setSubmitting(true);
      
      // Validate required fields
      if (!serviceName || !hourlyRate || !location || specialization.length === 0) {
        Alert.alert('Error', 'Please fill in all required fields');
        setSubmitting(false);
        return;
      }

      // Prepare profile data
      const profileData = {
        serviceName,
        description,
        hourlyRate: parseFloat(hourlyRate),
        specialization, 
        certifications,
        location,
        coordinates: {
          latitude: 0, 
          longitude: 0
        },
        isAvailable,
        workingHours: {
          start: workingStart,
          end: workingEnd
        },
        daysAvailable,
        shareLocation,
        officeAddress,
        profileImage: profileImage || null,
        experience: {
          years: parseInt(experienceYears) || 0,
          description: experienceDescription
        },
      };
      
      try {
        // Try API update first
        const apiResponse = await mechanicService.updateMechanicProfile(profileData);
        
        // Save to AsyncStorage with user-specific key
        if (userData) {
          const mechanicProfileKey = `mechanicProfile_${userData._id}`;
          await AsyncStorage.setItem(mechanicProfileKey, JSON.stringify({
            ...profileData,
            ...apiResponse
          }));
        }
        
        // Mark profile as complete
        setIsProfileComplete(true);
        
        Alert.alert('Success', 'Profile updated successfully');
      } catch (apiError) {
        console.error('API update failed:', apiError);
        
        // Save to AsyncStorage as backup
        if (userData) {
          const mechanicProfileKey = `mechanicProfile_${userData._id}`;
          await AsyncStorage.setItem(mechanicProfileKey, JSON.stringify(profileData));
        }
        
        // Mark profile as complete
        setIsProfileComplete(true);
        
        Alert.alert(
          'Partial Success', 
          'Could not update profile on server. Local backup created.'
        );
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSubmitting(false);
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
          <TouchableOpacity onPress={pickImage} style={styles.profileImageContainer}>
              {profileImage ? (
                <Image 
                  source={{ uri: profileImage }} 
                  style={styles.profileImage} 
                />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Ionicons name="person" size={60} color="#bdc3c7" />
                  <Text style={styles.uploadPhotoText}>Upload Photo</Text>
                </View>
              )}
            </TouchableOpacity>
          
          <Text style={styles.userName}>{userData?.name}</Text>
          <Text style={styles.userRole}>Mechanic</Text>
          
          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
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

          <Text style={styles.inputLabel}>Experience (Years)</Text>
          <TextInput
            style={styles.input}
            placeholder="Years of experience"
            value={experienceYears}
            onChangeText={setExperienceYears}
            keyboardType="numeric"
          />

          <Text style={styles.inputLabel}>Experience Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your experience..."
            value={experienceDescription}
            onChangeText={setExperienceDescription}
            multiline
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
                  specialization.includes(option) && styles.selectedSpecialization
                ]}
                onPress={() => toggleSpecialization(option)}
              >
                <Text
                  style={[
                    styles.specializationText,
                    specialization.includes(option) && styles.selectedSpecializationText
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.inputLabel}>Certifications</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your certifications (comma-separated)"
            value={certifications.join(', ')}
            onChangeText={(text) => setCertifications(text.split(',').map(cert => cert.trim()))}
          />
          
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
        
        {/* New section for location preferences */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Location Settings</Text>
          
          <View style={styles.availabilityToggle}>
            <Text style={styles.availabilityLabel}>Share my current location</Text>
            <Switch
              value={shareLocation}
              onValueChange={setShareLocation}
              trackColor={{ false: "#767577", true: "#f8d7da" }}
              thumbColor={shareLocation ? "#e74c3c" : "#f4f3f4"}
            />
          </View>
          
          <Text style={styles.locationHelpText}>
            {shareLocation 
              ? 'Customers will see your real-time location while this is enabled'
              : 'Enable to share your current location with customers'}
          </Text>
          
          <Text style={styles.inputLabel}>Office Address</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter your office address"
            value={officeAddress}
            onChangeText={setOfficeAddress}
            multiline
          />
          
          <Text style={styles.locationHelpText}>
            Used when current location sharing is disabled
          </Text>
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
  locationHelpText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 5,
    marginBottom: 15,
    fontStyle: 'italic',
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
  profileImageContainer: {
    alignSelf: 'center',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#f1f2f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  profileImagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#f1f2f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadPhotoText: {
    marginTop: 10,
    color: '#7f8c8d',
    fontSize: 14,
  },
});

export default MechanicProfileScreen;