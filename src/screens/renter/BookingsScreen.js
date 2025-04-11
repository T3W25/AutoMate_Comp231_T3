import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { bookingService } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BookingsScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    loadBookings();
  }, [activeTab]);
  
  useEffect(() => {
    // Refresh data when screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      loadBookings();
    });
    return unsubscribe;
  }, [navigation, activeTab]);
  
  const loadBookings = async () => {
    try {
      setLoading(true);
      const allBookings = await bookingService.getUserBookings();
      
      // Filter bookings based on active tab
      const filtered = allBookings.filter(booking => {
        const isCompleted = booking.status === 'completed' || booking.status === 'declined';
        return activeTab === 'completed' ? isCompleted : !isCompleted;
      });
      
      setBookings(filtered);
      setError(null);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setError('Failed to load bookings. Please try again.');
      
      // Attempt to load from cached data if API fails
      try {
        const cachedData = await AsyncStorage.getItem('cachedBookings');
        if (cachedData) {
          const allBookings = JSON.parse(cachedData);
          const filtered = allBookings.filter(booking => {
            const isCompleted = booking.status === 'completed' || booking.status === 'declined';
            return activeTab === 'completed' ? isCompleted : !isCompleted;
          });
          setBookings(filtered);
        }
      } catch (cacheError) {
        console.error('Error loading cached bookings:', cacheError);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleModifyBooking = (booking) => {
    // Implement navigation to edit booking
    Alert.alert('Modify Booking', 'This feature will be available soon.');
  };
  
  const handleCancelBooking = async (bookingId) => {
    Alert.alert(
      'Confirm Cancellation',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingService.updateBookingStatus(bookingId, 'cancelled');
              // Refresh bookings
              loadBookings();
              Alert.alert('Success', 'Booking cancelled successfully.');
            } catch (error) {
              console.error('Error cancelling booking:', error);
              Alert.alert('Error', 'Failed to cancel booking. Please try again.');
            }
          }
        }
      ]
    );
  };
  
  const renderBookingItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.bookingCard}
      onPress={() => {
        // Implement booking details navigation
        navigation.navigate('BookingDetails', { bookingId: item.id });
      }}
    >
      <View style={styles.bookingHeader}>
        <View style={styles.bookingTypeContainer}>
          <Ionicons 
            name={item.type === 'car' ? 'car' : 'build'} 
            size={16} 
            color="white" 
          />
          <Text style={styles.bookingTypeText}>
            {item.type === 'car' ? 'Car Rental' : 'Mechanic Service'}
          </Text>
        </View>
        <Text style={styles.bookingPrice}>${item.price}</Text>
      </View>
      
      <View style={styles.bookingContent}>
        <Text style={styles.bookingTitle}>{item.title}</Text>
        
        <View style={styles.bookingDetail}>
          <Ionicons name="calendar" size={16} color="#7f8c8d" />
          <Text style={styles.bookingDetailText}>
            {item.date} at {item.time} ({item.duration})
          </Text>
        </View>
        
        <View style={styles.bookingDetail}>
          <Ionicons name="location" size={16} color="#7f8c8d" />
          <Text style={styles.bookingDetailText}>{item.location}</Text>
        </View>
        
        <View style={styles.bookingDetail}>
          <Ionicons name="person" size={16} color="#7f8c8d" />
          <Text style={styles.bookingDetailText}>
            {item.type === 'car' ? `Owner: ${item.owner}` : `Mechanic: ${item.mechanic}`}
          </Text>
        </View>
      </View>
      
      <View style={styles.bookingActions}>
        {activeTab === 'upcoming' ? (
          <>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleModifyBooking(item)}
            >
              <Ionicons name="create-outline" size={18} color="#3498db" />
              <Text style={styles.actionButtonText}>Modify</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancelBooking(item.id)}
            >
              <Ionicons name="close-circle-outline" size={18} color="#e74c3c" />
              <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="reload-outline" size={18} color="#3498db" />
            <Text style={styles.actionButtonText}>Book Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
      </View>
      
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'upcoming' && styles.activeTab
          ]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'upcoming' && styles.activeTabText
          ]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'completed' && styles.activeTab
          ]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'completed' && styles.activeTabText
          ]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>
      
      {bookings.length > 0 ? (
        <FlatList
          data={bookings}
          renderItem={renderBookingItem}
          keyExtractor={(item, index) => item.id || index.toString()}
          contentContainerStyle={styles.bookingsList}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons 
            name={activeTab === 'upcoming' ? 'calendar-outline' : 'checkmark-circle-outline'} 
            size={60} 
            color="#bdc3c7" 
          />
          <Text style={styles.emptyStateText}>
            No {activeTab} bookings found
          </Text>
          {activeTab === 'upcoming' && (
            <TouchableOpacity style={styles.emptyStateButton}>
              <Text style={styles.emptyStateButtonText}>Find a Car or Mechanic</Text>
            </TouchableOpacity>
          )}
        </View>
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 5,
    margin: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#e3f2fd',
  },
  tabText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  activeTabText: {
    color: '#3498db',
    fontWeight: 'bold',
  },
  bookingsList: {
    padding: 15,
  },
  bookingCard: {
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
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#e3f2fd',
  },
  bookingTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  bookingTypeText: {
    color: 'white',
    marginLeft: 5,
    fontSize: 12,
    fontWeight: 'bold',
  },
  bookingPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  bookingContent: {
    padding: 15,
  },
  bookingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  bookingDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingDetailText: {
    marginLeft: 8,
    color: '#7f8c8d',
    fontSize: 14,
  },
  bookingActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f1f2f6',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  actionButtonText: {
    marginLeft: 5,
    color: '#3498db',
  },
  cancelButton: {
    borderLeftWidth: 1,
    borderLeftColor: '#f1f2f6',
  },
  cancelButtonText: {
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
  },
  emptyStateButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 15,
  },
  emptyStateButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default BookingsScreen;