import React, { useState, useEffect } from 'react';
import {
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mechanicService } from '../../services/api';
import Reviews from '../../components/Reviews';
import ReviewForm from '../../components/ReviewForm';
import ChatButton from '../../components/ChatButton';

const MechanicDetailsScreen = ({ route, navigation }) => {
  const { mechanicId } = route.params;
  const [mechanic, setMechanic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    loadMechanicDetails();
  }, [mechanicId]);

  const loadMechanicDetails = async () => {
    try {
      setLoading(true);
      const mechanicData = await mechanicService.getMechanicById(mechanicId);
      console.log("Mechanic Data:", JSON.stringify(mechanicData, null, 2));

      // Get profile image from the nested mechanic object if available
      const profileImage = (mechanicData.profileImage && mechanicData.profileImage.length > 0) || 
                    (mechanicData.mechanic && mechanicData.mechanic.profileImage && 
                     mechanicData.mechanic.profileImage.length > 0) 
                    ? (mechanicData.profileImage || mechanicData.mechanic.profileImage)
                    : 'https://your-default-image-url.com/default-profile.png';

      // Format working hours with days properly
      let workingHoursString = 'Not specified';
      if (mechanicData.workingHours) {
        const start = mechanicData.workingHours.start || '09:00';
        const end = mechanicData.workingHours.end || '18:00';
        
        // Format hours in 12-hour format with AM/PM
        const formatTime = (time) => {
          const [hours, minutes] = time.split(':');
          const hourNum = parseInt(hours, 10);
          const period = hourNum >= 12 ? 'PM' : 'AM';
          const hour12 = hourNum % 12 || 12;
          return `${hour12}:${minutes} ${period}`;
        };

        // Format days available
        let daysString = '';
        if (mechanicData.daysAvailable) {
          const availableDays = [];
          if (mechanicData.daysAvailable.monday) availableDays.push('Monday');
          if (mechanicData.daysAvailable.tuesday) availableDays.push('Tuesday');
          if (mechanicData.daysAvailable.wednesday) availableDays.push('Wednesday');
          if (mechanicData.daysAvailable.thursday) availableDays.push('Thursday');
          if (mechanicData.daysAvailable.friday) availableDays.push('Friday');
          if (mechanicData.daysAvailable.saturday) availableDays.push('Saturday');
          if (mechanicData.daysAvailable.sunday) availableDays.push('Sunday');
          
          if (availableDays.length > 0) {
            // If all weekdays are available, simplify to "Monday to Friday"
            if (availableDays.includes('Monday') && 
                availableDays.includes('Tuesday') && 
                availableDays.includes('Wednesday') && 
                availableDays.includes('Thursday') && 
                availableDays.includes('Friday') && 
                !availableDays.includes('Saturday') && 
                !availableDays.includes('Sunday')) {
              daysString = ', Monday to Friday';
            }
            // If all weekdays plus Saturday are available
            else if (availableDays.includes('Monday') && 
                     availableDays.includes('Tuesday') && 
                     availableDays.includes('Wednesday') && 
                     availableDays.includes('Thursday') && 
                     availableDays.includes('Friday') && 
                     availableDays.includes('Saturday') && 
                     !availableDays.includes('Sunday')) {
              daysString = ', Monday to Saturday';
            }
            // Otherwise list all available days
            else {
              daysString = ', ' + availableDays.join(', ');
            }
          }
        }

        workingHoursString = `${formatTime(start)} - ${formatTime(end)}${daysString}`;
      }
      
      // Format experience
      let formattedExperience = 'Not specified';
      if (mechanicData.experience) {
        if (typeof mechanicData.experience === 'object') {
          const years = mechanicData.experience.years || 0;
          formattedExperience = years > 0 ? `${years} years` : 'Not specified';
        } else if (typeof mechanicData.experience === 'number') {
          formattedExperience = `${mechanicData.experience} years`;
        }
      }
      
      // Comprehensive data mapping with default values
      setMechanic({
        id: mechanicData._id,
        mechanicUserId: mechanicData.mechanic?._id,
        name: mechanicData.mechanic?.name || mechanicData.name || 'Unknown Mechanic',
        specialization: Array.isArray(mechanicData.specialization) 
          ? mechanicData.specialization.join(', ') 
          : (mechanicData.specialization || 'General'),
        hourlyRate: mechanicData.hourlyRate || 0,
        rating: mechanicData.rating || mechanicData.mechanic?.rating || 0,
        reviews: mechanicData.numReviews || mechanicData.mechanic?.numReviews || 0,
        description: mechanicData.description || 'Professional auto repair services',
        distance: mechanicData.distance || 'N/A',
        isAvailable: mechanicData.isAvailable !== undefined 
          ? mechanicData.isAvailable 
          : true,
        experience: formattedExperience,
        experienceDescription: mechanicData.experience?.description || '',
        services: Array.isArray(mechanicData.services) 
          ? mechanicData.services 
          : [],
        certifications: Array.isArray(mechanicData.certifications) 
          ? mechanicData.certifications 
          : [],
        workingHours: workingHoursString,
        profileImage: profileImage,
        mechanic: mechanicData.mechanic  
      });
      
      setError(null);
    } catch (error) {
      console.error('Error loading mechanic details:', error);
      setError('Failed to load mechanic details');
      Alert.alert('Error', 'Unable to load mechanic details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestService = () => {
    if (!mechanic || !mechanic.mechanicUserId) {
      Alert.alert('Error', 'Mechanic user ID not available. Please try again.');
      return;
    }
    
    navigation.navigate('ServiceRequestScreen', {
      mechanic: {
        _id: mechanic.mechanicUserId, // Use the preserved user ID
        name: mechanic.name,
        specialization: mechanic.specialization,
        hourlyRate: mechanic.hourlyRate,
        rating: mechanic.rating,
      },
      userLocation: { latitude: 0, longitude: 0 }
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  if (error || !mechanic) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={60} color="#e74c3c" />
        <Text style={styles.errorText}>
          {error || 'Mechanic details not found'}
        </Text>
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
          {mechanic.profileImage ? (
            <Image 
              source={{ uri: mechanic.profileImage }} 
              style={styles.profileImage} 
              resizeMode="cover"
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="person" size={60} color="#bdc3c7" />
            </View>
          )}
          
          <Text style={styles.mechanicName}>{mechanic.name}</Text>
          <Text style={styles.mechanicSpecialization}>
            {mechanic.specialization}
          </Text>
          
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={18} color="#f39c12" />
            <Text style={styles.ratingText}>{mechanic.rating}</Text>
            <Text style={styles.reviewsText}>
              ({mechanic.reviews})
            </Text>
          </View>
          
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="location" size={16} color="#7f8c8d" />
              <Text style={styles.detailText}>
                {mechanic.distance} miles away
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons name="cash" size={16} color="#7f8c8d" />
              <Text style={styles.detailText}>
                ${mechanic.hourlyRate}/hour
              </Text>
            </View>
          </View>
          
          {mechanic.isAvailable && (
            <View style={styles.availableBadge}>
              <Text style={styles.availableText}>Available Now</Text>
            </View>
          )}
        </View>
  
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.descriptionText}>
            {mechanic.description}
          </Text>
          
          <View style={styles.infoItem}>
            <Ionicons name="time" size={16} color="#3498db" />
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Hours: </Text>
              {mechanic.workingHours}
            </Text>
          </View>
          
          {(mechanic.experience || mechanic.experienceDescription) && (
            <View style={styles.infoItem}>
              <Ionicons name="briefcase" size={16} color="#3498db" />
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>Experience: </Text>
                {mechanic.experience}
              </Text>
            </View>
          )}
          
          {mechanic.experienceDescription && (
            <Text style={styles.descriptionText}>
              {mechanic.experienceDescription}
            </Text>
          )}
        </View>
  
        {mechanic.services && mechanic.services.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services</Text>
            {mechanic.services.map((service, index) => (
              <View key={index} style={styles.serviceItem}>
                <Ionicons name="checkmark-circle" size={16} color="#2ecc71" />
                <Text style={styles.serviceText}>{service}</Text>
              </View>
            ))}
          </View>
        )}
  
        {mechanic.certifications && mechanic.certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {mechanic.certifications.map((certification, index) => (
              <View key={index} style={styles.certificationItem}>
                <Ionicons name="ribbon" size={16} color="#3498db" />
                <Text style={styles.certificationText}>{certification}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            <TouchableOpacity 
              style={styles.writeReviewButton}
              onPress={() => setShowReviewForm(true)}
            >
              <Text style={styles.writeReviewText}>Write a Review</Text>
            </TouchableOpacity>
          </View>
          <Reviews targetId={mechanic.id} targetType="User" />
        </View>
      </ScrollView>
  
      <View style={styles.footer}>
        <ChatButton 
          userId={mechanic.mechanic?._id}
          userName={mechanic.name}
          userRole="mechanic"
          size="large"
          buttonType="outlined"
          style={styles.messageButton}
        />
        
        <TouchableOpacity 
          style={styles.requestButton}
          onPress={handleRequestService}
        >
          <Text style={styles.requestButtonText}>Request Service</Text>
        </TouchableOpacity>
      </View>

      {showReviewForm && (
        <ReviewForm
          targetId={mechanic.id}
          targetType="User"
          onClose={() => setShowReviewForm(false)}
          onSuccess={() => {
            // Refresh the mechanic details to update rating
            loadMechanicDetails();
          }}
        />
      )}
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
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
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
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  writeReviewButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5
  },
  writeReviewText: {
    color: 'white',
    fontSize: 12
  },
});

export default MechanicDetailsScreen;