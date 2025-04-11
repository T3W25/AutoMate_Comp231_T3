import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentLocation } from '../../utils/locationService';
import { startLocationTracking, stopLocationTracking } from '../../utils/locationService';

const MechanicHomeScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeRequests, setActiveRequests] = useState([]);
  const [earnings, setEarnings] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
  });
  
  // New state for location tracking
  const [locationTracking, setLocationTracking] = useState(false);
  const [locationSubscription, setLocationSubscription] = useState(null);

  useEffect(() => {
    loadUserData();
    loadServiceRequests();
    checkLocationTrackingStatus();
  }, []);

  // Add effect for location tracking
  useEffect(() => {
    if (locationTracking) {
      startTracking();
    } else {
      stopTracking();
    }
    
    // Cleanup on component unmount
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [locationTracking]);

  const startTracking = async () => {
    try {
      const subscription = await startLocationTracking();
      setLocationSubscription(subscription);
      
      // Update UI
      Alert.alert('Location Sharing Enabled', 'Customers can now see your real-time location.');
    } catch (error) {
      console.error('Error starting location tracking:', error);
      setLocationTracking(false);
      Alert.alert('Error', 'Failed to start location tracking. Please check your permissions.');
    }
  };
  
  const stopTracking = async () => {
    try {
      if (locationSubscription) {
        await stopLocationTracking(locationSubscription);
        setLocationSubscription(null);
      }
      
      // Update UI
      Alert.alert('Location Sharing Disabled', 'Your location is no longer shared with customers.');
    } catch (error) {
      console.error('Error stopping location tracking:', error);
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
    } finally {
      setLoading(false);
    }
  };

  const checkLocationTrackingStatus = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        
        // Check if mechanic has location tracking enabled in their profile
        if (userData.mechanicProfile && userData.mechanicProfile.shareLocation !== undefined) {
          setLocationTracking(userData.mechanicProfile.shareLocation);
        }
        
        // Also check in registered mechanics
        const mechanicsStr = await AsyncStorage.getItem('registeredMechanics');
        if (mechanicsStr) {
          const mechanics = JSON.parse(mechanicsStr);
          const mechanic = mechanics.find(m => m.id === userData._id);
          
          if (mechanic && mechanic.shareLocation !== undefined) {
            setLocationTracking(mechanic.shareLocation);
          }
        }
      }
    } catch (error) {
      console.error('Error checking location tracking status:', error);
    }
  };

  const updateCurrentLocation = async () => {
    try {
      const location = await getCurrentLocation();
      if (location) {
        console.log('Got current location:', location);
        await updateMechanicLocation(location);
      } else {
        console.log('Could not get current location');
      }
    } catch (error) {
      console.error('Error updating current location:', error);
    }
  };

  const updateMechanicLocation = async (location) => {
    try {
      
      // user data
      const userDataString = await AsyncStorage.getItem('userData');
      if (!userDataString) return;
      
      const userData = JSON.parse(userDataString);
      
      // Update user data with location
      if (userData.mechanicProfile) {
        userData.mechanicProfile.currentLocation = {
          latitude: location.latitude,
          longitude: location.longitude,
          lastUpdated: new Date().toISOString()
        };
        
        // shareLocation preference if it changed
        userData.mechanicProfile.shareLocation = locationTracking;
        
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
      }
      
      // registered mechanics
      const mechanicsStr = await AsyncStorage.getItem('registeredMechanics');
      if (mechanicsStr) {
        const mechanics = JSON.parse(mechanicsStr);
        
        const updatedMechanics = mechanics.map(mechanic => {
          if (mechanic.id === userData._id) {
            return {
              ...mechanic,
              currentLocation: {
                latitude: location.latitude,
                longitude: location.longitude,
                lastUpdated: new Date().toISOString()
              },
              shareLocation: locationTracking
            };
          }
          return mechanic;
        });
        
        await AsyncStorage.setItem('registeredMechanics', JSON.stringify(updatedMechanics));
        console.log('Updated mechanic location in storage');
      }
    } catch (error) {
      console.error('Error saving location to storage:', error);
    }
  };

  const loadServiceRequests = async () => {
    try {
      if (!userData || !userData._id) {
        console.log('User data not available for loading requests');
        return;
      }
      
      console.log('Loading service requests for mechanic:', userData._id);
      
      // First try to get from API
      try {
        const response = await api.get('/mechanic-services');
        if (response.data && response.data.length > 0) {
          setActiveRequests(response.data);
          return;
        }
      } catch (apiError) {
        console.error('API error when loading service requests:', apiError);
        // Continue to local storage if API fails
      }
      
      // Try to get from AsyncStorage
      const requestsKey = `serviceRequests_${userData._id}`;
      const requestsStr = await AsyncStorage.getItem(requestsKey);
      
      if (requestsStr) {
        const requests = JSON.parse(requestsStr);
        console.log(`Found ${requests.length} service requests in storage`);
        
        if (requests.length > 0) {
          // Calculate total earnings
          const completedRequests = requests.filter(r => r.status === 'completed');
          const totalEarnings = completedRequests.reduce((total, req) => total + (req.totalAmount || 0), 0);
          
          // Set earnings data
          const today = new Date().toISOString().split('T')[0];
          const todayEarnings = completedRequests
            .filter(r => r.completedAt && r.completedAt.startsWith(today))
            .reduce((total, req) => total + (req.totalAmount || 0), 0);
          
          // Calculate start of week (Sunday)
          const now = new Date();
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
          
          const weekEarnings = completedRequests
            .filter(r => r.completedAt && r.completedAt >= startOfWeekStr)
            .reduce((total, req) => total + (req.totalAmount || 0), 0);
          
          setEarnings({
            today: todayEarnings,
            thisWeek: weekEarnings,
            thisMonth: totalEarnings, // Simplification
          });
          
          // Filter for active requests (pending or accepted)
          const active = requests.filter(r => r.status === 'pending' || r.status === 'accepted');
          setActiveRequests(active);
        } else {
          setActiveRequests([]);
        }
      } else {
        console.log('No service requests found in storage');
        setActiveRequests([]);
      }
    } catch (error) {
      console.error('Error loading service requests:', error);
      setActiveRequests([]);
    }
  };

  const toggleLocationTracking = async (value) => {
    setLocationTracking(value);
    
    if (value) {
      // Request permission and get current location when turning on
      try {
        const location = await getCurrentLocation();
        if (location) {
          await updateMechanicLocation(location);
        } else {
          Alert.alert(
            'Location Not Available',
            'Could not get your current location. Please check your device settings.'
          );
          setLocationTracking(false);
        }
      } catch (error) {
        console.error('Error getting location:', error);
        Alert.alert(
          'Location Error',
          'An error occurred while getting your location. Location tracking has been disabled.'
        );
        setLocationTracking(false);
      }
    } else {
      // Update storage to reflect tracking is off
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          
          if (userData.mechanicProfile) {
            userData.mechanicProfile.shareLocation = false;
            await AsyncStorage.setItem('userData', JSON.stringify(userData));
          }
          
          // Also update in registered mechanics
          const mechanicsStr = await AsyncStorage.getItem('registeredMechanics');
          if (mechanicsStr) {
            const mechanics = JSON.parse(mechanicsStr);
            
            const updatedMechanics = mechanics.map(mechanic => {
              if (mechanic.id === userData._id) {
                return {
                  ...mechanic,
                  shareLocation: false
                };
              }
              return mechanic;
            });
            
            await AsyncStorage.setItem('registeredMechanics', JSON.stringify(updatedMechanics));
          }
        }
      } catch (error) {
        console.error('Error updating location tracking status:', error);
      }
    }
  };

  const handleViewRequest = (requestId) => {
    navigation.navigate('ServiceRequestDetails', { requestId });
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
        <Text style={styles.headerTitle}>Mechanic Dashboard</Text>
        <Text style={styles.headerSubtitle}>Manage your repair services</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Location tracking toggle section */}
        <View style={styles.locationSection}>
          <Text style={styles.sectionTitle}>Location Sharing</Text>
          <View style={styles.locationToggle}>
            <View>
              <Text style={styles.locationLabel}>
                {locationTracking ? 'Currently sharing your location' : 'Location sharing is off'}
              </Text>
              <Text style={styles.locationHint}>
                {locationTracking 
                  ? 'Customers can see your real-time location' 
                  : 'Turn on to let customers see your real-time location'}
              </Text>
            </View>
            <Switch
              value={locationTracking}
              onValueChange={toggleLocationTracking}
              trackColor={{ false: "#767577", true: "#facfd9" }}
              thumbColor={locationTracking ? "#e74c3c" : "#f4f3f4"}
            />
          </View>
        </View>

        <View style={styles.earningsContainer}>
          <Text style={styles.sectionTitle}>Your Earnings</Text>
          <View style={styles.earningsStats}>
            <View style={styles.statItem}>
              <Text style={styles.statAmount}>${earnings.today}</Text>
              <Text style={styles.statLabel}>Today</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statAmount}>${earnings.thisWeek}</Text>
              <Text style={styles.statLabel}>This Week</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statAmount}>${earnings.thisMonth}</Text>
              <Text style={styles.statLabel}>This Month</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('MechanicProfile')}
            >
              <Ionicons name="person" size={24} color="#e74c3c" />
              <Text style={styles.actionButtonText}>My Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('ServiceRequests')}
            >
              <Ionicons name="list" size={24} color="#e74c3c" />
              <Text style={styles.actionButtonText}>Service Requests</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Messages')}
            >
              <Ionicons name="chatbubbles" size={24} color="#e74c3c" />
              <Text style={styles.actionButtonText}>Messages</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Requests</Text>
          
          {activeRequests.length > 0 ? (
            activeRequests.map((request) => (
              <TouchableOpacity 
                key={request.id}
                style={styles.requestItem}
                onPress={() => handleViewRequest(request.id)}
              >
                <View style={styles.requestHeader}>
                  <Text style={styles.customerName}>{request.customer}</Text>
                  <View style={[
                    styles.statusBadge,
                    request.status === 'pending' ? styles.pendingBadge : styles.acceptedBadge
                  ]}>
                    <Text style={styles.statusText}>
                      {request.status === 'pending' ? 'Pending' : 'Accepted'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.requestDetails}>
                  <View style={styles.requestDetail}>
                    <Ionicons name="car" size={16} color="#7f8c8d" />
                    <Text style={styles.detailText}>{request.vehicleType}</Text>
                  </View>
                  
                  <View style={styles.requestDetail}>
                    <Ionicons name="build" size={16} color="#7f8c8d" />
                    <Text style={styles.detailText}>{request.serviceType}</Text>
                  </View>
                  
                  <View style={styles.requestDetail}>
                    <Ionicons name="calendar" size={16} color="#7f8c8d" />
                    <Text style={styles.detailText}>{request.scheduledDate}</Text>
                  </View>
                </View>
                
                {request.isEmergency && (
                  <View style={styles.emergencyBadge}>
                    <Ionicons name="alert-circle" size={16} color="white" />
                    <Text style={styles.emergencyText}>Emergency</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="build" size={40} color="#bdc3c7" />
              <Text style={styles.emptyStateText}>No active requests</Text>
            </View>
          )}
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
  headerSubtitle: {
    fontSize: 16,
    color: '#fadbd8',
    marginTop: 5,
  },
  content: {
    padding: 15,
  },
  earningsContainer: {
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
  earningsStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#f1f2f6',
  },
  quickActions: {
    marginBottom: 15,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonText: {
    marginTop: 8,
    color: '#2c3e50',
    fontSize: 14,
  },
  section: {
    marginBottom: 20,
  },
  requestItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  pendingBadge: {
    backgroundColor: '#f39c12',
  },
  acceptedBadge: {
    backgroundColor: '#27ae60',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  requestDetails: {
    marginBottom: 10,
  },
  requestDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailText: {
    marginLeft: 10,
    color: '#7f8c8d',
  },
  emergencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  emergencyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  emptyState: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyStateText: {
    marginTop: 10,
    color: '#7f8c8d',
    fontSize: 16,
  },
  locationSection: {
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
  locationToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
  },
  locationLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  locationHint: {
    fontSize: 12,
    color: '#7f8c8d',
  },
});

export default MechanicHomeScreen;
