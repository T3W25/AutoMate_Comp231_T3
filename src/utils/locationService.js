import * as Location from 'expo-location';

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