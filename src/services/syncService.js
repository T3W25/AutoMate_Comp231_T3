// src/services/syncService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { bookingService, mechanicService, vehicleService } from './api';

// Synchronize offline bookings
export const syncOfflineBookings = async () => {
  try {
    const offlineBookingsStr = await AsyncStorage.getItem('offlineBookings');
    if (!offlineBookingsStr) return;
    
    const offlineBookings = JSON.parse(offlineBookingsStr);
    if (offlineBookings.length === 0) return;
    
    for (const booking of offlineBookings) {
      try {
        await bookingService.createBooking(booking);
      } catch (error) {
        console.error('Error syncing booking:', error);
      }
    }
    
    // Clear offline bookings
    await AsyncStorage.removeItem('offlineBookings');
  } catch (error) {
    console.error('Error synchronizing offline bookings:', error);
  }
};

// Synchronize offline service requests
export const syncOfflineServiceRequests = async () => {
  try {
    const offlineRequestsStr = await AsyncStorage.getItem('offlineServiceRequests');
    if (!offlineRequestsStr) return;
    
    const offlineRequests = JSON.parse(offlineRequestsStr);
    if (offlineRequests.length === 0) return;
    
    for (const request of offlineRequests) {
      try {
        await mechanicService.createServiceRequest(request);
      } catch (error) {
        console.error('Error syncing service request:', error);
      }
    }
    
    // Clear offline requests
    await AsyncStorage.removeItem('offlineServiceRequests');
  } catch (error) {
    console.error('Error synchronizing offline service requests:', error);
  }
};

// Synchronize offline locations
export const syncOfflineLocations = async () => {
  try {
    const offlineLocationsStr = await AsyncStorage.getItem('offlineLocations');
    if (!offlineLocationsStr) return;
    
    const offlineLocations = JSON.parse(offlineLocationsStr);
    if (offlineLocations.length === 0) return;
    
    // Send only the most recent location
    const mostRecent = offlineLocations.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    )[0];
    
    await api.post('/location/update', {
      latitude: mostRecent.latitude,
      longitude: mostRecent.longitude,
    });
    
    // Clear offline locations
    await AsyncStorage.removeItem('offlineLocations');
  } catch (error) {
    console.error('Error synchronizing offline locations:', error);
  }
};

// Main synchronization function
export const synchronizeOfflineData = async () => {
  const netInfo = await NetInfo.fetch();
  
  if (!netInfo.isConnected) {
    console.log('No internet connection, skipping synchronization');
    return;
  }
  
  // Check authentication
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      console.log('Not authenticated, skipping synchronization');
      return;
    }
    
    // Perform all synchronization tasks
    await syncOfflineBookings();
    await syncOfflineServiceRequests();
    await syncOfflineLocations();
    
    console.log('Synchronization completed');
  } catch (error) {
    console.error('Error during synchronization:', error);
  }
};

// Setup background sync
export const setupBackgroundSync = () => {
  // Listen for connection changes
  NetInfo.addEventListener(state => {
    if (state.isConnected) {
      // Connection restored, synchronize data
      synchronizeOfflineData();
    }
  });
};