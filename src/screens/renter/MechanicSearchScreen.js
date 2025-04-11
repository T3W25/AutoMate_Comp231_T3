import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity,
  FlatList,
  Switch,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentLocation } from '../../utils/locationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mechanicService } from '../../services/api';

const MechanicSearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [userData, setUserData] = useState(null);
  
  // Filter states
  const [availableNow, setAvailableNow] = useState(false);
  const [maxDistance, setMaxDistance] = useState('');
  const [maxRate, setMaxRate] = useState('');
  const [sortBy, setSortBy] = useState('distance'); // 'distance', 'rating', 'price'

  useEffect(() => {
    loadUserData();
    initializeLocation();
  }, []);

  useEffect(() => {
    // Once we have user location, load mechanics
    if (userLocation) {
      loadMechanics();
    }
  }, [userLocation]);

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
        console.log('Got user location:', location);
        setUserLocation(location);
      } else {
        console.log('Location not available, using default');
        // Set a default location if we can't get the real one
        setUserLocation({
          latitude: 43.6532,
          longitude: -79.3832
        });
        loadMechanics(); // Load mechanics even without location
      }
    } catch (error) {
      console.error('Error getting location:', error);
      // Set a default location on error
      setUserLocation({
        latitude: 43.6532,
        longitude: -79.3832
      });
      loadMechanics(); // Load mechanics even without location
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) {
      return Math.random() * 5 + 1; // Random fallback
    }
    
    // Distance calculation using Haversine formula
    const R = 3958.8; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
  };

  const loadMechanics = async () => {
    try {
      setLoading(true);
      
      // Prepare filters based on user interactions
      const filters = {};
      
      // Apply search query filter
      if (searchQuery) {
        filters.searchQuery = searchQuery;
      }
      
      // Apply availability filter
      if (availableNow) {
        filters.showAll = 'false';
      }
      
      // Apply distance filter
      if (maxDistance) {
        filters.maxDistance = parseFloat(maxDistance);
      }
      
      // Apply rate filter
      if (maxRate) {
        filters.maxRate = parseFloat(maxRate);
      }
      
      // Fetch mechanics from service
      const result = await mechanicService.getMechanics(filters);
      
      if (result && result.mechanics && result.mechanics.length > 0) {
        const mechanicsWithDistance = result.mechanics.map(mechanic => {
          let distance;
          
          // Determine mechanic's coordinates
          const mechanicLat = mechanic.coordinates?.latitude;
          const mechanicLon = mechanic.coordinates?.longitude;
          
          // Calculate distance if user location and mechanic coordinates are available
          if (userLocation && mechanicLat && mechanicLon) {
            distance = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              mechanicLat,
              mechanicLon
            );
          } else {
            // Fallback to random distance if coordinates are missing
            distance = 5 + Math.random() * 5;
          }
          
          // Construct mechanic object with additional details
          return {
            ...mechanic,
            id: mechanic._id, // Ensure consistent ID
            name: mechanic.mechanic?.name || mechanic.serviceName || 'Unknown Mechanic',
            specialization: Array.isArray(mechanic.specialization) 
              ? mechanic.specialization.join(', ') 
              : mechanic.specialization,
            distance: parseFloat(distance.toFixed(1)),
            rating: mechanic.rating || 0,
            hourlyRate: mechanic.hourlyRate || 0,
            isAvailable: mechanic.isAvailable !== undefined 
              ? mechanic.isAvailable 
              : true
          };
        });
        
        // Sort mechanics based on selected criteria
        let sortedMechanics = [...mechanicsWithDistance];
        
        switch (sortBy) {
          case 'distance':
            sortedMechanics.sort((a, b) => a.distance - b.distance);
            break;
          case 'rating':
            sortedMechanics.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
          case 'price':
            sortedMechanics.sort((a, b) => (a.hourlyRate || 0) - (b.hourlyRate || 0));
            break;
          default:
            // Default sorting by distance
            sortedMechanics.sort((a, b) => a.distance - b.distance);
        }
        
        // Apply additional filtering if needed
        const filteredMechanics = sortedMechanics.filter(mechanic => {
          // Filter by search query
          if (searchQuery) {
            const searchLower = searchQuery.toLowerCase();
            return (
              mechanic.name.toLowerCase().includes(searchLower) ||
              mechanic.specialization.toLowerCase().includes(searchLower)
            );
          }
          return true;
        });
        
        setMechanics(filteredMechanics);
      } else {
        // No mechanics found
        setMechanics([]);
        
        // Optional: Show a user-friendly message
        Alert.alert(
          'No Mechanics Found', 
          'We couldn\'t find any mechanics matching your search criteria.'
        );
      }
    } catch (error) {
      console.error('Error loading mechanics:', error);
      
      // Handle different types of errors
      if (error.response) {
        // The request was made and the server responded with a status code
        Alert.alert(
          'Error', 
          error.response.data.message || 'Failed to load mechanics. Please try again.'
        );
      } else if (error.request) {
        // The request was made but no response was received
        Alert.alert(
          'Network Error', 
          'Unable to connect to the server. Please check your internet connection.'
        );
      } else {
        // Something happened in setting up the request
        Alert.alert(
          'Unexpected Error', 
          'An unexpected error occurred. Please try again later.'
        );
      }
      
      // Fallback to empty list
      setMechanics([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleMechanicSelect = (mechanic) => {
    navigation.navigate('MechanicDetails', { mechanicId: mechanic.id || mechanic._id });
  };

  const handleRequestService = (mechanic) => {
    // Navigation to service request form with mechanic data and user location
    navigation.navigate('ServiceRequest', { 
      mechanic: mechanicData, 
      userLocation: currentLocation
    });
  };

  const handleChat = async (mechanic) => {
    try {
      if (!userData) {
        Alert.alert('Error', 'You need to be logged in to chat');
        return;
      }
      
      // Navigate to chat
      navigation.navigate('ChatRoom', {
        otherUserId: mechanic.id || mechanic._id,
        otherUserName: mechanic.name,
        mechanicService: true
      });
    } catch (error) {
      console.error('Error opening chat:', error);
      Alert.alert('Error', 'Failed to open chat. Please try again.');
    }
  };

  const renderMechanicItem = ({ item }) => (
    <View style={styles.mechanicCard}>
      <TouchableOpacity 
        style={styles.mechanicContent}
        onPress={() => handleMechanicSelect(item)}
      >
        <View style={styles.mechanicImagePlaceholder}>
          {item.profileImage ? (
            <Image source={{ uri: item.profileImage }} style={styles.mechanicImage} />
          ) : (
            <Ionicons name="person" size={40} color="#bdc3c7" />
          )}
        </View>
        <View style={styles.mechanicInfo}>
          <Text style={styles.mechanicName}>{item.name}</Text>
          <Text style={styles.mechanicSpecialization}>{item.specialization}</Text>
          <View style={styles.mechanicDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="star" size={14} color="#f39c12" />
              <Text style={styles.detailText}>{item.rating || 'New'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="location" size={14} color="#7f8c8d" />
              <Text style={styles.detailText}>{item.distance} miles</Text>
            </View>
          </View>
        </View>
        <View style={styles.mechanicPricing}>
          <Text style={styles.mechanicPrice}>${item.hourlyRate}</Text>
          <Text style={styles.priceLabel}>per hour</Text>
          {item.isAvailable && (
            <View style={styles.availableBadge}>
              <Text style={styles.availableText}>Available</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.messageButton}
          onPress={() => handleChat(item)}
        >
          <Ionicons name="chatbubble" size={16} color="#3498db" />
          <Text style={styles.actionText}>Message</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.requestButton}
          onPress={() => handleRequestService(item)}
        >
          <Ionicons name="build" size={16} color="white" />
          <Text style={styles.requestText}>Request Service</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const applyFilters = () => {
    loadMechanics();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find a Mechanic</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#7f8c8d" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or specialization"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="options" size={24} color="#3498db" />
        </TouchableOpacity>
      </View>
      
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Available Now Only</Text>
            <Switch
              value={availableNow}
              onValueChange={setAvailableNow}
              trackColor={{ false: "#767577", true: "#bde0fe" }}
              thumbColor={availableNow ? "#3498db" : "#f4f3f4"}
            />
          </View>
          
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Maximum Distance (miles)</Text>
            <TextInput
              style={styles.inputField}
              keyboardType="numeric"
              value={maxDistance}
              onChangeText={setMaxDistance}
              placeholder="Any"
            />
          </View>
          
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Maximum Hourly Rate ($)</Text>
            <TextInput
              style={styles.inputField}
              keyboardType="numeric"
              value={maxRate}
              onChangeText={setMaxRate}
              placeholder="Any"
            />
          </View>
          
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Sort By</Text>
            <View style={styles.sortButtons}>
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  sortBy === 'distance' && styles.sortButtonActive
                ]}
                onPress={() => setSortBy('distance')}
              >
                <Text style={sortBy === 'distance' ? styles.sortButtonTextActive : styles.sortButtonText}>
                  Nearest
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  sortBy === 'rating' && styles.sortButtonActive
                ]}
                onPress={() => setSortBy('rating')}
              >
                <Text style={sortBy === 'rating' ? styles.sortButtonTextActive : styles.sortButtonText}>
                  Highest Rated
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  sortBy === 'price' && styles.sortButtonActive
                ]}
                onPress={() => setSortBy('price')}
              >
                <Text style={sortBy === 'price' ? styles.sortButtonTextActive : styles.sortButtonText}>
                  Lowest Price
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.applyButton}
            onPress={applyFilters}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      ) : (
        <FlatList
          data={mechanics.filter(mechanic => 
            (mechanic.name && mechanic.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (mechanic.specialization && mechanic.specialization.toLowerCase().includes(searchQuery.toLowerCase()))
          )}
          renderItem={renderMechanicItem}
          keyExtractor={(item) => (item.id || item._id).toString()}
          contentContainerStyle={styles.mechanicsList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="build-outline" size={60} color="#bdc3c7" />
              <Text style={styles.emptyStateText}>No mechanics found</Text>
            </View>
          }
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
  header: {
    padding: 20,
    backgroundColor: '#3498db',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
  },
  filterButton: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filtersContainer: {
    backgroundColor: 'white',
    padding: 15,
    margin: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  filterLabel: {
    fontSize: 16,
    color: '#2c3e50',
  },
  inputField: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 8,
    width: 100,
    textAlign: 'center',
  },
  sortButtons: {
    flexDirection: 'column',
  },
  sortButton: {
    padding: 8,
    borderRadius: 5,
    marginBottom: 5,
  },
  sortButtonActive: {
    backgroundColor: '#e3f2fd',
  },
  sortButtonText: {
    color: '#7f8c8d',
  },
  sortButtonTextActive: {
    color: '#3498db',
    fontWeight: 'bold',
  },
  applyButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  applyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  mechanicsList: {
    padding: 15,
  },
  mechanicCard: {
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
  mechanicContent: {
    flexDirection: 'row',
  },
  mechanicImagePlaceholder: {
    width: 70,
    height: 70,
    backgroundColor: '#f1f2f6',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  mechanicImage: {
    width: '100%',
    height: '100%',
  },
  mechanicInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  mechanicName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 3,
  },
  mechanicSpecialization: {
    fontSize: 14,
    color: '#3498db',
    marginBottom: 5,
  },
  mechanicDetails: {
    flexDirection: 'row',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  detailText: {
    marginLeft: 5,
    color: '#7f8c8d',
    fontSize: 14,
  },
  mechanicPricing: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    width: 80,
  },
  mechanicPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  priceLabel: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  availableBadge: {
    backgroundColor: '#e3fcef',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 5,
  },
  availableText: {
    color: '#27ae60',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f1f2f6',
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 8,
    flex: 1,
  },
  actionText: {
    color: '#3498db',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  requestText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  emptyState: {
    alignItems: 'center',
    padding: 50,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#7f8c8d',
    marginTop: 10,
  },
});

export default MechanicSearchScreen;