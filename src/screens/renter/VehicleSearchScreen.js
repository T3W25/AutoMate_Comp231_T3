import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity,
  ScrollView,
  Switch,
  FlatList,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { vehicleService } from '../../services/api';

const VehicleSearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filter states
  const [electricOnly, setElectricOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  
  useEffect(() => {
    loadVehicles();
  }, []);
  
  const loadVehicles = async (pageNumber = 1, filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      // Build filters object
      const apiFilters = {
        ...filters,
        pageNumber,
      };
      
      if (electricOnly) {
        apiFilters.fuelType = 'Electric';
      }
      
      if (maxPrice) {
        apiFilters.maxPrice = maxPrice;
      }
      
      // Handle sorting - Note: Server-side sorting would be implemented differently
      const { vehicles, pages, count } = await vehicleService.getVehicles(apiFilters);
      
      let sortedVehicles = [...vehicles];
      if (sortBy === 'priceAsc') {
        sortedVehicles.sort((a, b) => a.pricePerDay - b.pricePerDay);
      } else if (sortBy === 'priceDesc') {
        sortedVehicles.sort((a, b) => b.pricePerDay - a.pricePerDay);
      }
      
      if (pageNumber === 1) {
        setVehicles(sortedVehicles);
      } else {
        setVehicles([...vehicles, ...sortedVehicles]);
      }
      
      setTotalPages(pages);
      setPage(pageNumber);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      setError('Failed to load vehicles. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = () => {
    loadVehicles(1, { 
      make: searchQuery,
      model: searchQuery,
      location: searchQuery
    });
  };
  
  const loadMoreVehicles = () => {
    if (page < totalPages && !loading) {
      loadVehicles(page + 1);
    }
  };
  
  const filterVehicles = () => {
    loadVehicles(1);
  };
  
  const handleVehicleSelect = (vehicle) => {
    navigation.navigate('VehicleDetails', { vehicleId: vehicle._id });
  };

  const renderVehicleItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.vehicleCard}
      onPress={() => handleVehicleSelect(item)}
    >
      <View style={styles.vehicleImagePlaceholder}>
        <Ionicons name="car" size={40} color="#bdc3c7" />
      </View>
      <View style={styles.vehicleInfo}>
        <Text style={styles.vehicleName}>{item.make} {item.model} ({item.year})</Text>
        <Text style={styles.vehicleLocation}>
          <Ionicons name="location" size={16} color="#7f8c8d" /> {item.location}
        </Text>
        <View style={styles.vehicleRating}>
          <Ionicons name="star" size={16} color="#f39c12" />
          <Text style={styles.ratingText}>{item.rating || 'New'}</Text>
        </View>
      </View>
      <View style={styles.vehiclePricing}>
        <Text style={styles.vehiclePrice}>${item.pricePerDay}</Text>
        <Text style={styles.priceLabel}>per day</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find a Vehicle</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#7f8c8d" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by make, model, or location"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
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
            <Text style={styles.filterLabel}>Electric Vehicles Only</Text>
            <Switch
              value={electricOnly}
              onValueChange={setElectricOnly}
              trackColor={{ false: "#767577", true: "#bde0fe" }}
              thumbColor={electricOnly ? "#3498db" : "#f4f3f4"}
            />
          </View>
          
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Maximum Price per Day ($)</Text>
            <TextInput
              style={styles.priceInput}
              keyboardType="numeric"
              value={maxPrice}
              onChangeText={setMaxPrice}
              placeholder="Any"
            />
          </View>
          
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Sort By</Text>
            <View style={styles.sortButtons}>
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  sortBy === 'recommended' && styles.sortButtonActive
                ]}
                onPress={() => setSortBy('recommended')}
              >
                <Text style={sortBy === 'recommended' ? styles.sortButtonTextActive : styles.sortButtonText}>
                  Recommended
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  sortBy === 'priceAsc' && styles.sortButtonActive
                ]}
                onPress={() => setSortBy('priceAsc')}
              >
                <Text style={sortBy === 'priceAsc' ? styles.sortButtonTextActive : styles.sortButtonText}>
                  Price: Low to High
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  sortBy === 'priceDesc' && styles.sortButtonActive
                ]}
                onPress={() => setSortBy('priceDesc')}
              >
                <Text style={sortBy === 'priceDesc' ? styles.sortButtonTextActive : styles.sortButtonText}>
                  Price: High to Low
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.applyButton}
            onPress={filterVehicles}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {loading && page === 1 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      ) : (
        <FlatList
          data={vehicles}
          renderItem={renderVehicleItem}
          keyExtractor={item => item._id.toString()}
          contentContainerStyle={styles.vehiclesList}
          onEndReached={loadMoreVehicles}
          onEndReachedThreshold={0.1}
          ListFooterComponent={
            loading && page > 1 ? (
              <ActivityIndicator 
                style={styles.loadingMore} 
                size="small" 
                color="#3498db" 
              />
            ) : null
          }
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyState}>
                <Ionicons name="car-outline" size={60} color="#bdc3c7" />
                <Text style={styles.emptyStateText}>No vehicles found</Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
};

// Same styles as before
const styles = StyleSheet.create({
  // (existing styles from previous implementation)
  // ...
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    padding: 15,
    backgroundColor: '#f8d7da',
    margin: 15,
    borderRadius: 10,
  },
  errorText: {
    color: '#721c24',
    textAlign: 'center',
  },
  loadingMore: {
    padding: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#7f8c8d',
    marginTop: 10,
  },
});

export default VehicleSearchScreen;