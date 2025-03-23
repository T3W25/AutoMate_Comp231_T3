import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ServiceRequestTracker from './ServiceRequestTracker'; // Import the new component

const RenterHomeScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Welcome, {userData?.name}</Text>
        <Text style={styles.headerSubtitle}>Find your perfect ride or mechanic</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Search Cars')}
            >
              <Ionicons name="car" size={24} color="#3498db" />
              <Text style={styles.actionButtonText}>Find a Car</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Find Mechanic')}
            >
              <Ionicons name="build" size={24} color="#3498db" />
              <Text style={styles.actionButtonText}>Find a Mechanic</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Bookings')}
            >
              <Ionicons name="calendar" size={24} color="#3498db" />
              <Text style={styles.actionButtonText}>My Bookings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Service Request Tracker Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Requests</Text>
          <ServiceRequestTracker 
            navigation={navigation} 
            userData={userData} 
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Searches</Text>
          <View style={styles.emptyState}>
            <Ionicons name="search" size={40} color="#bdc3c7" />
            <Text style={styles.emptyStateText}>No recent searches</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
          <View style={styles.emptyState}>
            <Ionicons name="calendar" size={40} color="#bdc3c7" />
            <Text style={styles.emptyStateText}>No upcoming bookings</Text>
          </View>
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
    backgroundColor: '#3498db',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e3f2fd',
    marginTop: 5,
  },
  content: {
    padding: 15,
  },
  quickActions: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
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
});

export default RenterHomeScreen;