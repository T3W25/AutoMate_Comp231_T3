// src/screens/renter/MechanicDetailsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MechanicDetailsScreen = ({ route, navigation }) => {
  const { mechanicId } = route.params;
  const [mechanic, setMechanic] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMechanicDetails();
  }, []);

  const loadMechanicDetails = async () => {
    try {
      setLoading(true);
      // For demonstration, using mock data
      // In a real app, you would fetch mechanic data from API
      setTimeout(() => {
        const mockMechanic = {
          id: mechanicId,
          name: 'John Smith',
          specialization: 'Engine Repair Specialist',
          rating: 4.8,
          reviews: 42,
          distance: 1.2,
          hourlyRate: 75,
          available: true,
          experience: '10 years',
          description: 'Specialized in engine diagnostics and repairs. Certified by ASE with over 10 years of experience working with all major car brands including Toyota, Honda, Ford, and BMW.',
          services: [
            'Engine Diagnostics',
            'Engine Repair',
            'Transmission Service',
            'Oil Change',
            'Brake Service',
            'Battery Replacement'
          ],
          certifications: [
            'ASE Master Technician',
            'Toyota Certified Technician',
            'Honda Professional Technician'
          ],
          availableHours: '8:00 AM - 6:00 PM, Monday to Saturday'
        };
        setMechanic(mockMechanic);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading mechanic details:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load mechanic details. Please try again.');
    }
  };

  const handleRequestService = () => {
    navigation.navigate('ServiceRequest', { mechanic });
  };

  const handleMessage = () => {
    navigation.navigate('ChatRoom', { 
      otherUserId: mechanic.id,
      mechanicService: true
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  if (!mechanic) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={60} color="#e74c3c" />
        <Text style={styles.errorText}>Mechanic not found</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
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
          <Text style={styles.headerTitle}>Mechanic Details</Text>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Ionicons name="person" size={60} color="#bdc3c7" />
          </View>
          
          <Text style={styles.mechanicName}>{mechanic.name}</Text>
          <Text style={styles.mechanicSpecialization}>{mechanic.specialization}</Text>
          
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={18} color="#f39c12" />
            <Text style={styles.ratingText}>{mechanic.rating}</Text>
            <Text style={styles.reviewsText}>({mechanic.reviews} reviews)</Text>
          </View>
          
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="location" size={16} color="#7f8c8d" />
              <Text style={styles.detailText}>{mechanic.distance} miles away</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons name="cash" size={16} color="#7f8c8d" />
              <Text style={styles.detailText}>${mechanic.hourlyRate}/hour</Text>
            </View>
          </View>
          
          {mechanic.available && (
            <View style={styles.availableBadge}>
              <Text style={styles.availableText}>Available Now</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.descriptionText}>{mechanic.description}</Text>
          
          <View style={styles.infoItem}>
            <Ionicons name="time" size={16} color="#3498db" />
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Hours: </Text>
              {mechanic.availableHours}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="briefcase" size={16} color="#3498db" />
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Experience: </Text>
              {mechanic.experience}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          {mechanic.services.map((service, index) => (
            <View key={index} style={styles.serviceItem}>
              <Ionicons name="checkmark-circle" size={16} color="#2ecc71" />
              <Text style={styles.serviceText}>{service}</Text>
            </View>
          ))}
        </View>

        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certifications</Text>
          {mechanic.certifications.map((certification, index) => (
            <View key={index} style={styles.certificationItem}>
              <Ionicons name="ribbon" size={16} color="#3498db" />
              <Text style={styles.certificationText}>{certification}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.messageButton}
          onPress={handleMessage}
        >
          <Ionicons name="chatbubble" size={20} color="#3498db" />
          <Text style={styles.messageButtonText}>Message</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.requestButton}
          onPress={handleRequestService}
        >
          <Text style={styles.requestButtonText}>Request Service</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#3498db',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 15,
  },
  profileSection: {
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#f1f2f6',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  mechanicName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  mechanicSpecialization: {
    fontSize: 16,
    color: '#3498db',
    marginBottom: 10,
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
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  detailText: {
    marginLeft: 5,
    color: '#7f8c8d',
  },
  availableBadge: {
    backgroundColor: '#e3fcef',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  availableText: {
    color: '#27ae60',
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  descriptionText: {
    fontSize: 16,
    color: '#2c3e50',
    lineHeight: 24,
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 15,
    color: '#2c3e50',
  },
  infoLabel: {
    fontWeight: 'bold',
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  serviceText: {
    marginLeft: 10,
    fontSize: 15,
    color: '#2c3e50',
  },
  certificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  certificationText: {
    marginLeft: 10,
    fontSize: 15,
    color: '#2c3e50',
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 5,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  messageButtonText: {
    color: '#3498db',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 5,
  },
  requestButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default MechanicDetailsScreen;