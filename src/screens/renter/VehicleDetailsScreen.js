import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { vehicleService, bookingService } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BookingCalendar from '../../components/BookingCalendar';

const VehicleDetailsScreen = ({ route, navigation }) => {
  const { vehicleId } = route.params;
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [showBookingCalendar, setShowBookingCalendar] = useState(false);
  
  // For booking form
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadVehicleDetails();
    loadUserData();
  }, []);

  const loadVehicleDetails = async () => {
    try {
      setLoading(true);
      const vehicleData = await vehicleService.getVehicleById(vehicleId);
      setVehicle(vehicleData);
    } catch (error) {
      console.error('Error loading vehicle details:', error);
      setError('Failed to load vehicle details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

  const handleBookNow = () => {
    setShowBookingCalendar(true);
  };

  const handleContactOwner = () => {
    if (!vehicle || !vehicle.owner || !userData) {
      Alert.alert('Error', 'Missing information. Please try again later.');
      return;
    }
    
    // Navigate to chat room, passing the necessary parameters
    navigation.navigate('ChatRoom', {
      otherUserId: vehicle.owner._id,
      vehicleId: vehicle._id
    });
  };

  const renderFeature = (name, isAvailable) => (
    <View style={styles.featureItem}>
      <Ionicons 
        name={isAvailable ? 'checkmark-circle' : 'close-circle'} 
        size={20} 
        color={isAvailable ? '#2ecc71' : '#e74c3c'} 
      />
      <Text style={styles.featureText}>{name}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={60} color="#e74c3c" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={loadVehicleDetails}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!vehicle) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vehicle Details</Text>
        </View>

        <View style={styles.imageContainer}>
          <View style={styles.imagePlaceholder}>
            <Ionicons name="car" size={80} color="#bdc3c7" />
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.vehicleName}>{vehicle.make} {vehicle.model} ({vehicle.year})</Text>
          
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={18} color="#f39c12" />
            <Text style={styles.ratingText}>
              {vehicle.rating > 0 ? vehicle.rating.toFixed(1) : 'New'}
            </Text>
            <Text style={styles.reviewsText}>
              ({vehicle.numReviews} reviews)
            </Text>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Price per day:</Text>
            <Text style={styles.priceValue}>${vehicle.pricePerDay}</Text>
          </View>

          <View style={styles.ownerInfo}>
            <Text style={styles.sectionTitle}>Vehicle Owner</Text>
            <View style={styles.ownerRow}>
              <View style={styles.ownerImagePlaceholder}>
                <Ionicons name="person" size={30} color="#bdc3c7" />
              </View>
              <View style={styles.ownerDetails}>
                <Text style={styles.ownerName}>{vehicle.owner.name}</Text>
                <View style={styles.ownerRating}>
                  <Ionicons name="star" size={16} color="#f39c12" />
                  <Text style={styles.ownerRatingText}>
                    {vehicle.owner.rating > 0 ? vehicle.owner.rating.toFixed(1) : 'New'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.contactButton}
                onPress={handleContactOwner}
              >
                <Text style={styles.contactButtonText}>Contact</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vehicle Details</Text>
            
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Type</Text>
                <Text style={styles.detailValue}>{vehicle.vehicleType}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Transmission</Text>
                <Text style={styles.detailValue}>{vehicle.transmission}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Fuel Type</Text>
                <Text style={styles.detailValue}>{vehicle.fuelType}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Seats</Text>
                <Text style={styles.detailValue}>{vehicle.seats}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Features</Text>
            <View style={styles.featuresContainer}>
              {renderFeature('Air Conditioning', vehicle.features.hasAC)}
              {renderFeature('GPS Navigation', vehicle.features.hasGPS)}
              {renderFeature('Bluetooth', vehicle.features.hasBluetooth)}
              {renderFeature('USB Port', vehicle.features.hasUSB)}
              {renderFeature('Child Seat', vehicle.features.hasChildSeat)}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={20} color="#3498db" />
              <Text style={styles.locationText}>{vehicle.location}</Text>
            </View>
          </View>

          {vehicle.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{vehicle.description}</Text>
            </View>
          )}

          {showBookingCalendar && (
            <BookingCalendar
                vehicle={vehicle}
                onClose={() => setShowBookingCalendar(false)}
                onBookingComplete={() => {
                // You could trigger a refresh of bookings or navigate to bookings screen
                }}
            />
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.bookButton}
          onPress={handleBookNow}
        >
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#7f8c8d',
    textAlign: 'center',
    marginVertical: 15,
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
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
  imageContainer: {
    width: '100%',
    height: 220,
    backgroundColor: '#f1f2f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#dfe6e9',
  },
  detailsContainer: {
    padding: 15,
  },
  vehicleName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ratingText: {
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 5,
  },
  reviewsText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginLeft: 5,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3498db',
    marginLeft: 5,
  },
  ownerInfo: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f1f2f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownerDetails: {
    flex: 1,
    marginLeft: 15,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  ownerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  ownerRatingText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginLeft: 5,
  },
  contactButton: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  contactButtonText: {
    color: '#3498db',
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
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
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: 'bold',
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 10,
  },
  featureText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#2c3e50',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#2c3e50',
  },
  descriptionText: {
    fontSize: 16,
    color: '#2c3e50',
    lineHeight: 24,
  },
  footer: {
    backgroundColor: 'white',
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 5,
  },
  bookButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default VehicleDetailsScreen;