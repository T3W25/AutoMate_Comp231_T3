import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ServiceRequestTracker from '../renter/ServiceRequestTracker'; // Import the same component

// Mock data for car earnings and recent activities
const MOCK_EARNINGS = {
  thisMonth: 520,
  lastMonth: 430,
  totalEarnings: 2450,
};

const MOCK_ACTIVITIES = [
  {
    id: '1',
    type: 'rental_request',
    title: 'New Rental Request',
    description: 'John Smith requested your Toyota Camry',
    date: '2 hours ago',
    unread: true,
  },
  {
    id: '2',
    type: 'rental_completed',
    title: 'Rental Completed',
    description: 'Your Honda Civic rental has been completed',
    date: '2 days ago',
    unread: false,
  },
  {
    id: '3',
    type: 'payment_received',
    title: 'Payment Received',
    description: 'You received $120 for your Toyota Camry rental',
    date: '5 days ago',
    unread: false,
  },
];

const CarOwnerHomeScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState(MOCK_ACTIVITIES);

  useEffect(() => {
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

    loadUserData();
  }, []);

  useEffect(() => {
    // This will refresh the data when the screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      if (!loading) {
        // No need to reload user data, but we can trigger
        // other data-refresh operations here if needed
      }
    });

    return unsubscribe;
  }, [navigation, loading]);

  const markAsRead = (id) => {
    setActivities(
      activities.map(activity => 
        activity.id === id ? { ...activity, unread: false } : activity
      )
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2ecc71" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Welcome, {userData?.name}</Text>
        <Text style={styles.headerSubtitle}>Manage your vehicles and rentals</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.earningsContainer}>
          <Text style={styles.sectionTitle}>Your Earnings</Text>
          <View style={styles.earningsStats}>
            <View style={styles.statItem}>
              <Text style={styles.statAmount}>${MOCK_EARNINGS.thisMonth}</Text>
              <Text style={styles.statLabel}>This Month</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statAmount}>${MOCK_EARNINGS.lastMonth}</Text>
              <Text style={styles.statLabel}>Last Month</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statAmount}>${MOCK_EARNINGS.totalEarnings}</Text>
              <Text style={styles.statLabel}>All Time</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Add Vehicle')}
            >
              <Ionicons name="add-circle" size={24} color="#2ecc71" />
              <Text style={styles.actionButtonText}>Add Vehicle</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('My Vehicles')}
            >
              <Ionicons name="car" size={24} color="#2ecc71" />
              <Text style={styles.actionButtonText}>My Vehicles</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Requests')}
            >
              <Ionicons name="list" size={24} color="#2ecc71" />
              <Text style={styles.actionButtonText}>View Requests</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Add Service Request Tracker Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mechanic Services</Text>
          <ServiceRequestTracker 
            navigation={navigation} 
            userData={userData} 
          />
          <View style={styles.mechanicContainer}>
            <TouchableOpacity 
              style={styles.mechanicButton}
              onPress={() => navigation.navigate('Find Mechanic')}
            >
              <Ionicons name="build" size={24} color="#2ecc71" />
              <Text style={styles.mechanicButtonText}>Find a Mechanic</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.activitiesContainer}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          
          {activities.length > 0 ? (
            activities.map(activity => (
              <TouchableOpacity 
                key={activity.id}
                style={[
                  styles.activityItem,
                  activity.unread && styles.unreadActivity
                ]}
                onPress={() => markAsRead(activity.id)}
              >
                <View style={styles.activityIconContainer}>
                  <Ionicons 
                    name={
                      activity.type === 'rental_request' ? 'notifications' :
                      activity.type === 'rental_completed' ? 'checkmark-circle' : 'cash'
                    } 
                    size={24} 
                    color="#2ecc71" 
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityDescription}>{activity.description}</Text>
                  <Text style={styles.activityDate}>{activity.date}</Text>
                </View>
                {activity.unread && (
                  <View style={styles.unreadIndicator} />
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off" size={40} color="#bdc3c7" />
              <Text style={styles.emptyStateText}>No recent activities</Text>
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
    backgroundColor: '#2ecc71',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e3fef1',
    marginTop: 5,
  },
  content: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
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
    color: '#2ecc71',
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
  section: {
    marginBottom: 20,
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
  activitiesContainer: {
    marginBottom: 20,
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadActivity: {
    borderLeftWidth: 3,
    borderLeftColor: '#2ecc71',
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3fef1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  activityDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  activityDate: {
    fontSize: 12,
    color: '#95a5a6',
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2ecc71',
    alignSelf: 'center',
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
  mechanicContainer: {
    marginTop: 15,
  },
  mechanicButton: {
    backgroundColor: '#e3fef1',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mechanicButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2ecc71',
    marginLeft: 10,
  }
});

export default CarOwnerHomeScreen;