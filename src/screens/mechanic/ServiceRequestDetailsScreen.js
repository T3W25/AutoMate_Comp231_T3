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

const ServiceRequestDetailsScreen = ({ route, navigation }) => {
  const { requestId } = route.params;
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequestDetails();
  }, []);

  const loadRequestDetails = async () => {
    try {
      setLoading(true);
      // In a real app, fetch from API
      // For now, mock data
      setTimeout(() => {
        const mockRequest = {
          id: requestId,
          customer: 'John Doe',
          vehicleType: 'Sedan',
          serviceType: 'Engine Repair',
          description: 'Engine making unusual noise when starting',
          isEmergency: requestId === 'req1', // Make first request emergency
          scheduledDate: '2025-03-25 10:00 AM',
          location: 'Customer location',
          status: 'pending',
        };
        setRequest(mockRequest);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading request:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load request details');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e74c3c" />
      </View>
    );
  }

  if (!request) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Request</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <Text style={styles.customerName}>{request.customer}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vehicle Type:</Text>
            <Text style={styles.detailValue}>{request.vehicleType}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service Type:</Text>
            <Text style={styles.detailValue}>{request.serviceType}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Scheduled Date:</Text>
            <Text style={styles.detailValue}>{request.scheduledDate}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>{request.location}</Text>
          </View>
          
          {request.isEmergency && (
            <View style={styles.emergencyBadge}>
              <Ionicons name="alert-circle" size={16} color="white" />
              <Text style={styles.emergencyText}>Emergency Service</Text>
            </View>
          )}
          
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>Description:</Text>
            <Text style={styles.descriptionText}>{request.description}</Text>
          </View>
        </View>

        {request.status === 'pending' && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.declineButton}
              onPress={() => {
                Alert.alert('Request Declined', 'You declined this service request');
                navigation.goBack();
              }}
            >
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.acceptButton}
              onPress={() => {
                Alert.alert('Request Accepted', 'You accepted this service request');
                navigation.goBack();
              }}
            >
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#e74c3c',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 15,
  },
  content: {
    padding: 15,
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  customerName: {
    fontSize: 16,
    color: '#2c3e50',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  detailLabel: {
    width: 120,
    fontSize: 14,
    color: '#7f8c8d',
  },
  detailValue: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
  },
  emergencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginTop: 10,
    marginBottom: 15,
  },
  emergencyText: {
    marginLeft: 5,
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  descriptionContainer: {
    marginTop: 10,
  },
  descriptionLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  descriptionText: {
    fontSize: 16,
    color: '#2c3e50',
    lineHeight: 22,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
  },
  declineButtonText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: 'bold',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#fadbd8',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ServiceRequestDetailsScreen;