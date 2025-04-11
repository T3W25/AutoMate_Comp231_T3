import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { vehicleService } from '../../services/api';
import { getCurrentLocation } from '../../utils/locationService';

const { width, height } = Dimensions.get('window');

const VehicleMapScreen = ({ navigation }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [region, setRegion] = useState({
    latitude: 43.6532,
    longitude: -79.3832,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    loadVehicles();
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    try {
      const location = await getCurrentLocation();
      if (location) {
        setUserLocation(location);
        setRegion({
          ...region,
          latitude: location.latitude,
          longitude: location.longitude,
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Unable to access your location. Please check your device settings.'
      );
    }
  };

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const { vehicles } = await vehicleService.getVehicles({ showAll: 'true' });
      
      // Filter vehicles with valid coordinates
      const vehiclesWithLocation = vehicles.filter(vehicle => 
        vehicle.coordinates && 
        vehicle.coordinates.latitude && 
        vehicle.coordinates.longitude
      );
      
      setVehicles(vehiclesWithLocation);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      setError('Failed to load vehicles on map.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerPress = (vehicle) => {
    navigation.navigate('VehicleDetails', { vehicleId: vehicle._id });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Nearby Vehicles</Text>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      ) : (
        <MapView
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {vehicles.map(vehicle => (
            <Marker
              key={vehicle._id}
              coordinate={{
                latitude: vehicle.coordinates.latitude,
                longitude: vehicle.coordinates.longitude,
              }}
              title={`${vehicle.make} ${vehicle.model}`}
              description={`$${vehicle.pricePerDay}/day`}
              onCalloutPress={() => handleMarkerPress(vehicle)}
            >
              <View style={styles.markerContainer}>
                <View style={styles.marker}>
                  <Ionicons name="car" size={16} color="#3498db" />
                </View>
                <View style={styles.markerPriceTag}>
                  <Text style={styles.markerPrice}>${vehicle.pricePerDay}</Text>
                </View>
              </View>
              <Callout tooltip>
                <View style={styles.calloutContainer}>
                  <Text style={styles.calloutTitle}>{vehicle.make} {vehicle.model}</Text>
                  <Text style={styles.calloutSubtitle}>{vehicle.year} • {vehicle.vehicleType}</Text>
                  <Text style={styles.calloutPrice}>${vehicle.pricePerDay}/day</Text>
                  <Text style={styles.calloutAction}>Tap for details</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      )}
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <TouchableOpacity 
        style={styles.locationButton}
        onPress={initializeLocation}
      >
        <Ionicons name="locate" size={24} color="#3498db" />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.listViewButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="list" size={24} color="white" />
        <Text style={styles.listViewButtonText}>List View</Text>
      </TouchableOpacity>
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
  map: {
    width: width,
    height: height - 120,
  },
  errorContainer: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    backgroundColor: '#f8d7da',
    padding: 10,
    borderRadius: 5,
  },
  errorText: {
    color: '#721c24',
    textAlign: 'center',
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 8,
    borderWidth: 3,
    borderColor: '#3498db',
  },
  markerPriceTag: {
    backgroundColor: '#3498db',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 5,
  },
  markerPrice: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  calloutContainer: {
    width: 200,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  calloutSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  calloutPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 5,
  },
  calloutAction: {
    fontSize: 12,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  locationButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  listViewButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#3498db',
    borderRadius: 10,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  listViewButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
});

export default VehicleMapScreen;