import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { vehicleService } from '../../services/api';

const ManageVehiclesScreen = ({ navigation }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Load vehicles when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadVehicles();
    });

    return unsubscribe;
  }, [navigation]);
  
  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const ownerVehicles = await vehicleService.getOwnerVehicles();
      setVehicles(ownerVehicles);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      setError('Failed to load vehicles. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    loadVehicles();
  };
  
  const toggleAvailability = async (id, currentStatus) => {
    try {
      await vehicleService.updateVehicle(id, { 
        isAvailable: !currentStatus 
      });
      
      // Update local state
      setVehicles(
        vehicles.map(vehicle => 
          vehicle._id === id 
            ? { ...vehicle, isAvailable: !currentStatus } 
            : vehicle
        )
      );
    } catch (error) {
      console.error('Error updating vehicle:', error);
      Alert.alert('Error', 'Failed to update vehicle availability.');
    }
  };
  
  const handleDeleteVehicle = (id) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this vehicle?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await vehicleService.deleteVehicle(id);
              
              // Update local state
              setVehicles(vehicles.filter(vehicle => vehicle._id !== id));
              
              Alert.alert('Success', 'Vehicle deleted successfully');
            } catch (error) {
              console.error('Error deleting vehicle:', error);
              Alert.alert('Error', 'Failed to delete vehicle.');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };
  
  const handleEditVehicle = (vehicle) => {
    navigation.navigate('Add Vehicle', { vehicle, isEditing: true });
  };
  
  const renderVehicleItem = ({ item }) => (
    <View style={styles.vehicleCard}>
      <View style={styles.vehicleHeader}>
        <View style={styles.vehicleImagePlaceholder}>
          <Ionicons name="car" size={40} color="#bdc3c7" />
        </View>
        
        <View style={styles.vehicleHeaderInfo}>
          <Text style={styles.vehicleName}>{item.make} {item.model} ({item.year})</Text>
          <Text style={styles.vehiclePlate}>License: {item.licensePlate}</Text>
        </View>
        
        <View style={styles.availabilityContainer}>
          <Switch
            value={item.isAvailable}
            onValueChange={() => toggleAvailability(item._id, item.isAvailable)}
            trackColor={{ false: "#767577", true: "#c8f7d6" }}
            thumbColor={item.isAvailable ? "#2ecc71" : "#f4f3f4"}
          />
          <Text style={item.isAvailable ? styles.availableText : styles.unavailableText}>
            {item.isAvailable ? 'Available' : 'Unavailable'}
          </Text>
        </View>
      </View>
      
      <View style={styles.vehicleStats}>
        <View style={styles.statItem}>
          <Ionicons name="cash-outline" size={16} color="#2ecc71" />
          <Text style={styles.statText}>${item.pricePerDay}/day</Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="location-outline" size={16} color="#3498db" />
          <Text style={styles.statText}>{item.location}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="star" size={16} color="#f39c12" />
          <Text style={styles.statText}>{item.rating || 'New'}</Text>
        </View>
      </View>
      
      <View style={styles.vehicleStats}>
        <View style={styles.statItem}>
          <Ionicons name="calendar-outline" size={16} color="#9b59b6" />
          <Text style={styles.statText}>{item.totalRentals || 0} rentals</Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="wallet-outline" size={16} color="#16a085" />
          <Text style={styles.statText}>${item.totalEarnings || 0} earned</Text>
        </View>
      </View>
      
      <View style={styles.vehicleActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleEditVehicle(item)}
        >
          <Ionicons name="create-outline" size={18} color="#3498db" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            // Will implement calendar functionality in future
            Alert.alert('Coming Soon', 'Availability calendar will be available soon.');
          }}
        >
          <Ionicons name="calendar-outline" size={18} color="#f39c12" />
          <Text style={styles.actionButtonText}>Calendar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteVehicle(item._id)}
        >
          <Ionicons name="trash-outline" size={18} color="#e74c3c" />
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Vehicles</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2ecc71" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Vehicles</Text>
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <View style={styles.content}>
        {vehicles.length > 0 ? (
          <FlatList
            data={vehicles}
            renderItem={renderVehicleItem}
            keyExtractor={item => item._id.toString()}
            contentContainerStyle={styles.vehiclesList}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="car-outline" size={80} color="#bdc3c7" />
            <Text style={styles.emptyStateText}>You haven't added any vehicles yet</Text>
            <TouchableOpacity 
              style={styles.addVehicleButton}
              onPress={() => navigation.navigate('Add Vehicle')}
            >
              <Text style={styles.addVehicleButtonText}>Add a Vehicle</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {vehicles.length > 0 && (
        <TouchableOpacity 
          style={styles.floatingButton}
          onPress={() => navigation.navigate('Add Vehicle')}
        >
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
};

// Keep the same styles as before

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#2ecc71',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
  },
  vehiclesList: {
    padding: 15,
  },
  vehicleCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  vehicleHeader: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  vehicleImagePlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#f1f2f6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleHeaderInfo: {
    flex: 1,
    paddingHorizontal: 15,
    justifyContent: 'center',
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  vehiclePlate: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  availabilityContainer: {
    alignItems: 'center',
  },
  availableText: {
    color: '#2ecc71',
    fontSize: 12,
    marginTop: 5,
  },
  unavailableText: {
    color: '#7f8c8d',
    fontSize: 12,
    marginTop: 5,
  },
  vehicleStats: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 5,
    color: '#7f8c8d',
    fontSize: 14,
  },
  vehicleActions: {
    flexDirection: 'row',
    padding: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    margin: 5,
    borderRadius: 5,
    backgroundColor: '#f1f2f6',
  },
  actionButtonText: {
    marginLeft: 5,
    color: '#2c3e50',
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: '#fae9e8',
  },
  deleteButtonText: {
    color: '#e74c3c',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#7f8c8d',
    marginVertical: 15,
    textAlign: 'center',
  },
  addVehicleButton: {
    backgroundColor: '#2ecc71',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 15,
  },
  addVehicleButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2ecc71',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
});

export default ManageVehiclesScreen;