import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export const requestLocationPermission = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
};

export const getCurrentLocation = async () => {
  const hasPermission = await requestLocationPermission();
  
  if (!hasPermission) {
    return null;
  }
  
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
};

export const startLocationTracking = async () => {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      throw new Error('Location permission not granted');
    }
    
    // Check if user is a mechanic
    const userDataString = await AsyncStorage.getItem('userData');
    const userData = JSON.parse(userDataString);
    
    if (!userData || userData.role !== 'mechanic') {
      throw new Error('Only mechanics can track location');
    }
    
    // Start location tracking
    const locationSubscription = Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 60000, // Update every minute
        distanceInterval: 100, // Update every 100 meters
      },
      async (location) => {
        try {
          // Send location to server
          await api.post('/location/update', {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          
          // Store last location in local storage
          await AsyncStorage.setItem('lastLocation', JSON.stringify({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: new Date().toISOString()
          }));
        } catch (error) {
          console.error('Error updating location:', error);
          // Store in offline queue
          const offlineLocations = await AsyncStorage.getItem('offlineLocations') || '[]';
          const locations = JSON.parse(offlineLocations);
          
          locations.push({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: new Date().toISOString()
          });
          
          await AsyncStorage.setItem('offlineLocations', JSON.stringify(locations));
        }
      }
    );
    
    
    // Store subscription reference
    await AsyncStorage.setItem('locationSubscription', 'active');
    
    return locationSubscription;
  } catch (error) {
    console.error('Error starting location tracking:', error);
    throw error;
  }
};

export const geocodeLocation = async (address) => {
  try {
    const locations = await Location.geocodeAsync(address);
    if (locations && locations.length > 0) {
      return {
        latitude: locations[0].latitude,
        longitude: locations[0].longitude,
      };
    }
    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
};

export const stopLocationTracking = async (subscription) => {
  try {
    if (subscription) {
      await subscription.remove();
    }
    
    await AsyncStorage.removeItem('locationSubscription');
    
    return true;
  } catch (error) {
    console.error('Error stopping location tracking:', error);
    return false;
  }
};

export const getMechanicLocation = async (mechanicId) => {
  try {
    const response = await api.get(`/location/mechanic/${mechanicId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting mechanic location:', error);
    throw error;
  }
};

export const reverseGeocodeLocation = async (latitude, longitude) => {
  try {
    const addresses = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });
    
    if (addresses && addresses.length > 0) {
      const address = addresses[0];
      return {
        street: address.street,
        city: address.city,
        region: address.region,
        country: address.country,
        postalCode: address.postalCode,
        formattedAddress: `${address.street}, ${address.city}, ${address.region} ${address.postalCode}, ${address.country}`,
      };
    }
    return null;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
};