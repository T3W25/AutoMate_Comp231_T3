import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity,
  FlatList,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    specialization: 'Electrical Systems',
    rating: 4.9,
    distance: 2.5,
    hourlyRate: 85,
    available: true,
  },
  {
    id: '3',
    name: 'Michael Davis',
    specialization: 'Brake Specialist',
    rating: 4.7,
    distance: 3.1,
    hourlyRate: 70,
    available: true,
  },
  {
    id: '4',
    name: 'Jessica Williams',
    specialization: 'General Maintenance',
    rating: 4.6,
    distance: 4.0,
    hourlyRate: 65,
    available: true,
  },
];

const MechanicSearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [mechanics, setMechanics] = useState(MOCK_MECHANICS);
  
  // Filter states
  const [availableNow, setAvailableNow] = useState(false);
  const [maxDistance, setMaxDistance] = useState('');
  const [maxRate, setMaxRate] = useState('');
  const [sortBy, setSortBy] = useState('distance'); // 'distance', 'rating', 'price'

  const renderMechanicItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.mechanicCard}
      onPress={() => {
        // Will implement mechanic details navigation in future
        alert(`You selected ${item.name}, ${item.specialization}`);
      }}
    >
      <View style={styles.mechanicImagePlaceholder}>
        <Ionicons name="person" size={40} color="#bdc3c7" />
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
  );

  const filterMechanics = () => {
    let filtered = [...MOCK_MECHANICS];
    
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
      
      <FlatList
        data={mechanics}
        renderItem={renderMechanicItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.mechanicsList}
      />
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
    flexDirection: 'row',
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
  mechanicImagePlaceholder: {
    width: 70,
    height: 70,
    backgroundColor: '#f1f2f6',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default MechanicSearchScreen;