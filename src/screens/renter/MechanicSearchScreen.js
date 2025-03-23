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
    loadMechanics();
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
        setUserLocation(location);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Unable to access your location. Please check your device settings.'
      );
    }
  };

  const loadMechanics = async () => {
    try {
      setLoading(true);
      const result = await mechanicService.getMechanics();
      
      // If we got a proper response from the API or our mock data
      if (result && result.mechanics) {
        setMechanics(result.mechanics);
      } else {
        // Create some mock data if nothing came back
        setMechanics(MOCK_MECHANICS);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading mechanics:', error);
      setMechanics(MOCK_MECHANICS); // Use mock data on error
      setLoading(false);
    }
  };
  
  const calculateDistance = (userLoc, mechLoc) => {
    if (!userLoc || !mechLoc) return Math.random() * 5 + 1; // Random distance if locations not available
    
    // Simple distance calculation (not accurate for real geo, but works for demo)
    const lat1 = userLoc.latitude;
    const lon1 = userLoc.longitude;
    const lat2 = mechLoc.latitude || 0;
    const lon2 = mechLoc.longitude || 0;
    
    const R = 3958.8; // Radius of the Earth in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return parseFloat(distance.toFixed(1));
  };

  const handleMechanicSelect = (mechanic) => {
    navigation.navigate('MechanicDetails', { mechanicId: mechanic.id });
  };

  const handleRequestService = (mechanic) => {
    // Navigation to service request form
    navigation.navigate('ServiceRequest', { 
      mechanic,
      userLocation
    });
  };

  const handleChat = async (mechanic) => {
    try {
      // Get current user data
      const userDataStr = await AsyncStorage.getItem('userData');
      if (!userDataStr) {
        Alert.alert('Error', 'You need to be logged in to chat');
        return;
      }
      
      const userData = JSON.parse(userDataStr);
      
      // Get or create chat conversation
      const conversationKey = `chat_${userData._id}_${mechanic.id}`;
      let conversationStr = await AsyncStorage.getItem(conversationKey);
      
      if (!conversationStr) {
        // Create a new conversation
        const newConversation = {
          id: Date.now().toString(),
          participants: [userData._id, mechanic.id],
          participantNames: {
            [userData._id]: userData.name,
            [mechanic.id]: mechanic.name
          },
          messages: [],
          lastMessageTimestamp: new Date().toISOString()
        };
        
        await AsyncStorage.setItem(conversationKey, JSON.stringify(newConversation));
        conversationStr = JSON.stringify(newConversation);
      }
      
      const conversation = JSON.parse(conversationStr);
      
      // Navigate to chat
      navigation.navigate('ChatRoom', {
        conversationId: conversation.id,
        otherUserId: mechanic.id,
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
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.mechanicImage} />
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
              <Text style={styles.detailText}>{item.rating}</Text>
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
          {item.available && (
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

  const filterMechanics = () => {
    let filtered = [...mechanics];
    
    // Filter by availability
    if (availableNow) {
      filtered = filtered.filter(m => m.available);
    }
    
    // Filter by max distance
    if (maxDistance) {
      filtered = filtered.filter(m => m.distance <= parseFloat(maxDistance));
    }
    
    // Filter by max hourly rate
    if (maxRate) {
      filtered = filtered.filter(m => m.hourlyRate <= parseInt(maxRate));
    }
    
    // Sort mechanics
    if (sortBy === 'distance') {
      filtered.sort((a, b) => a.distance - b.distance);
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'price') {
      filtered.sort((a, b) => a.hourlyRate - b.hourlyRate);
    }
    
    setMechanics(filtered);
  };

  // Mock data for mechanics
  const MOCK_MECHANICS = [
    {
      id: '1',
      name: 'John Smith',
      specialization: 'Engine Repair',
      rating: 4.8,
      distance: 1.2,
      hourlyRate: 75,
      available: true,
      imageUrl: null, // Replace with actual image URL if available
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      specialization: 'Electrical Systems',
      rating: 4.9,
      distance: 2.5,
      hourlyRate: 85,
      available: true,
      imageUrl: null,
    },
    {
      id: '3',
      name: 'Michael Davis',
      specialization: 'Brake Specialist',
      rating: 4.7,
      distance: 3.1,
      hourlyRate: 70,
      available: true,
      imageUrl: null,
    },
    {
      id: '4',
      name: 'Jessica Williams',
      specialization: 'General Maintenance',
      rating: 4.6,
      distance: 4.0,
      hourlyRate: 65,
      available: true,
      imageUrl: null,
    },
  ];

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
           onPress={filterMechanics}
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
         keyExtractor={item => item.id}
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