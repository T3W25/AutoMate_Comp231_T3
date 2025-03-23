// src/screens/mechanic/MechanicHomeScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MechanicHomeScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeRequests, setActiveRequests] = useState([]);
  const [earnings, setEarnings] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
  });

  useEffect(() => {
    loadUserData();
    loadServiceRequests();
  }, []);

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

  const loadServiceRequests = async () => {
    try {
      // In a real app, you would fetch service requests from API
      // For now, using mock data
      setTimeout(() => {
        setActiveRequests([
          {
            id: 'req1',
            customer: 'John Doe',
            vehicleType: 'Sedan',
            serviceType: 'Engine Repair',
            scheduledDate: '2025-03-25 10:00 AM',
            status: 'pending',
            isEmergency: true,
          },
          {
            id: 'req2',
            customer: 'Jane Smith',
            vehicleType: 'SUV',
            serviceType: 'Oil Change',
            scheduledDate: '2025-03-26 2:00 PM',
            status: 'accepted',
            isEmergency: false,
          },
        ]);

        setEarnings({
          today: 150,
          thisWeek: 680,
          thisMonth: 2450,
        });
      }, 1000);
    } catch (error) {
      console.error('Error loading service requests:', error);
      Alert.alert('Error', 'Failed to load service requests.');
    }
  };

  const handleViewRequest = (requestId) => {
    navigation.navigate('ServiceRequestDetails', { requestId });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e74c3c" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mechanic Dashboard</Text>
        <Text style={styles.headerSubtitle}>Manage your repair services</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.earningsContainer}>
          <Text style={styles.sectionTitle}>Your Earnings</Text>
          <View style={styles.earningsStats}>
            <View style={styles.statItem}>
              <Text style={styles.statAmount}>${earnings.today}</Text>
              <Text style={styles.statLabel}>Today</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statAmount}>${earnings.thisWeek}</Text>
              <Text style={styles.statLabel}>This Week</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statAmount}>${earnings.thisMonth}</Text>
              <Text style={styles.statLabel}>This Month</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('MechanicProfile')}
            >
              <Ionicons name="person" size={24} color="#e74c3c" />
              <Text style={styles.actionButtonText}>My Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('ServiceRequests')}
            >
              <Ionicons name="list" size={24} color="#e74c3c" />
              <Text style={styles.actionButtonText}>Service Requests</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Messages')}
            >
              <Ionicons name="chatbubbles" size={24} color="#e74c3c" />
              <Text style={styles.actionButtonText}>Messages</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Requests</Text>
          
          {activeRequests.length > 0 ? (
            activeRequests.map((request) => (
              <TouchableOpacity 
                key={request.id}
                style={styles.requestItem}
                onPress={() => handleViewRequest(request.id)}
              >
                <View style={styles.requestHeader}>
                  <Text style={styles.customerName}>{request.customer}</Text>
                  <View style={[
                    styles.statusBadge,
                    request.status === 'pending' ? styles.pendingBadge : styles.acceptedBadge
                  ]}>
                    <Text style={styles.statusText}>
                      {request.status === 'pending' ? 'Pending' : 'Accepted'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.requestDetails}>
                  <View style={styles.requestDetail}>
                    <Ionicons name="car" size={16} color="#7f8c8d" />
                    <Text style={styles.detailText}>{request.vehicleType}</Text>
                  </View>
                  
                  <View style={styles.requestDetail}>
                    <Ionicons name="build" size={16} color="#7f8c8d" />
                    <Text style={styles.detailText}>{request.serviceType}</Text>
                  </View>
                  
                  <View style={styles.requestDetail}>
                    <Ionicons name="calendar" size={16} color="#7f8c8d" />
                    <Text style={styles.detailText}>{request.scheduledDate}</Text>
                  </View>
                </View>
                
                {request.isEmergency && (
                  <View style={styles.emergencyBadge}>
                    <Ionicons name="alert-circle" size={16} color="white" />
                    <Text style={styles.emergencyText}>Emergency</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="build" size={40} color="#bdc3c7" />
              <Text style={styles.emptyStateText}>No active requests</Text>
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
    backgroundColor: '#e74c3c',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fadbd8',
    marginTop: 5,
  },
  content: {
    padding: 15,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
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
    color: '#e74c3c',
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
  requestItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  pendingBadge: {
    backgroundColor: '#f39c12',
  },
  acceptedBadge: {
    backgroundColor: '#27ae60',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  requestDetails: {
    marginBottom: 10,
  },
  requestDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailText: {
    marginLeft: 10,
    color: '#7f8c8d',
  },
  emergencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  emergencyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
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

export default MechanicHomeScreen;