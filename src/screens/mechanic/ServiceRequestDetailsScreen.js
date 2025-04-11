// src/screens/mechanic/ServiceRequestDetailsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mechanicService } from '../../services/api';

const ServiceRequestDetailsScreen = ({ route, navigation }) => {
  const { requestId } = route.params;
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [estimateAmount, setEstimateAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    loadRequestDetails();
  }, []);
  
  const loadRequestDetails = async () => {
    try {
      setLoading(true);
      const response = await mechanicService.getServiceRequestById(requestId);
      setRequest(response);
    } catch (error) {
      console.error('Error loading request details:', error);
      Alert.alert('Error', 'Failed to load request details');
    } finally {
      setLoading(false);
    }
  };
  
  const handleProvideEstimate = async () => {
    if (!estimateAmount || isNaN(parseFloat(estimateAmount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    try {
      setSubmitting(true);
      await mechanicService.provideEstimate(requestId, parseFloat(estimateAmount));
      Alert.alert('Success', 'Estimate sent to customer');
      navigation.goBack();
    } catch (error) {
      console.error('Error providing estimate:', error);
      Alert.alert('Error', 'Failed to send estimate');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleAcceptRequest = async () => {
    try {
      setSubmitting(true);
      await mechanicService.updateServiceRequestStatus(requestId, 'accepted');
      Alert.alert('Success', 'Request accepted');
      navigation.goBack();
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Failed to accept request');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleDeclineRequest = async () => {
    try {
      setSubmitting(true);
      await mechanicService.updateServiceRequestStatus(requestId, 'declined');
      Alert.alert('Success', 'Request declined');
      navigation.goBack();
    } catch (error) {
      console.error('Error declining request:', error);
      Alert.alert('Error', 'Failed to decline request');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleCompleteService = async () => {
    try {
      setSubmitting(true);
      await mechanicService.completeServiceRequest(requestId, parseFloat(estimateAmount));
      Alert.alert('Success', 'Service marked as completed');
      navigation.goBack();
    } catch (error) {
      console.error('Error completing service:', error);
      Alert.alert('Error', 'Failed to complete service');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e74c3c" />
      </View>
    );
  }
  
  if (!request) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Request Details</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Request not found</Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Details</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Customer Information</Text>
            <View style={[
              styles.statusBadge,
              request.status === 'pending' ? styles.pendingBadge :
              request.status === 'estimated' ? styles.estimatedBadge :
              request.status === 'accepted' ? styles.acceptedBadge :
              request.status === 'completed' ? styles.completedBadge :
              styles.declinedBadge
            ]}>
              <Text style={styles.statusText}>
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </Text>
            </View>
          </View>
          
          <View style={styles.customerInfo}>
            <View style={styles.customerImagePlaceholder}>
              <Ionicons name="person" size={30} color="#bdc3c7" />
            </View>
            <View style={styles.customerDetails}>
              <Text style={styles.customerName}>
                {request.customer ? request.customer.name : 'Customer'}
              </Text>
              <Text style={styles.customerContact}>
                {request.customer ? request.customer.phone : 'No contact info'}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Details</Text>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Vehicle Type:</Text>
            <Text style={styles.detailValue}>{request.vehicleType}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Service Type:</Text>
            <Text style={styles.detailValue}>{request.serviceType}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Scheduled Date:</Text>
            <Text style={styles.detailValue}>
              {new Date(request.scheduledDate).toLocaleString()}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>{request.location}</Text>
          </View>
          
          {request.isEmergency && (
            <View style={styles.emergencyBanner}>
              <Ionicons name="warning" size={20} color="white" />
              <Text style={styles.emergencyText}>Emergency Service</Text>
            </View>
          )}
          
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>Description:</Text>
            <Text style={styles.descriptionText}>{request.description}</Text>
          </View>
        </View>
        
        {request.images && request.images.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {request.images.map((image, index) => {
                // Construct the full URL for the image
                const imageUrl = `http://192.168.2.15:5000${image}`;
                console.log('Loading image from:', imageUrl);
                
                return (
                  <Image
                    key={index}
                    source={{ uri: imageUrl }}
                    style={styles.image}
                    onError={(e) => console.error('Image load error:', e.nativeEvent.error)}
                  />
                );
              })}
            </ScrollView>
          </View>
        )}
        
        {request.status === 'pending' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Provide Estimate</Text>
            <View style={styles.estimateContainer}>
              <Text style={styles.estimateLabel}>Estimated Amount ($):</Text>
              <TextInput
                style={styles.estimateInput}
                value={estimateAmount}
                onChangeText={setEstimateAmount}
                keyboardType="numeric"
                placeholder="Enter amount"
              />
              <TouchableOpacity
                style={styles.estimateButton}
                onPress={handleProvideEstimate}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.estimateButtonText}>Send Estimate</Text>
                )}
              </TouchableOpacity>
            </View>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.declineButton}
                onPress={handleDeclineRequest}
                disabled={submitting}
              >
                <Text style={styles.declineButtonText}>Decline</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={handleAcceptRequest}
                disabled={submitting}
              >
                <Text style={styles.acceptButtonText}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {request.status === 'accepted' && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleCompleteService}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.completeButtonText}>Mark as Completed</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        
        {request.status === 'estimated' && (
          <View style={styles.section}>
            <View style={styles.estimateInfo}>
              <Text style={styles.estimateInfoLabel}>Estimate Amount:</Text>
              <Text style={styles.estimateInfoValue}>${request.estimatedAmount}</Text>
            </View>
            <Text style={styles.waitingText}>
              Waiting for customer to accept or decline your estimate...
            </Text>
          </View>
        )}
        
        {request.status === 'completed' && (
          <View style={styles.section}>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentInfoLabel}>Final Amount:</Text>
              <Text style={styles.paymentInfoValue}>${request.finalAmount}</Text>
            </View>
            <View style={styles.paymentStatus}>
              <Ionicons name="checkmark-circle" size={24} color="#2ecc71" />
              <Text style={styles.paymentStatusText}>
                {request.paymentStatus === 'paid' ? 'Payment Received' : 'Payment Pending'}
              </Text>
            </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#e74c3c',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
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
  estimatedBadge: {
    backgroundColor: '#3498db',
  },
  acceptedBadge: {
    backgroundColor: '#2ecc71',
  },
  completedBadge: {
    backgroundColor: '#9b59b6',
  },
  declinedBadge: {
    backgroundColor: '#e74c3c',
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerImagePlaceholder: {
    width: 50,
    height: 50,
    backgroundColor: '#f1f2f6',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerDetails: {
    marginLeft: 15,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  customerContact: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  detailItem: {
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
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
  },
  emergencyText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  descriptionContainer: {
    marginTop: 15,
  },
  descriptionLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  descriptionText: {
    fontSize: 16,
    color: '#2c3e50',
    lineHeight: 24,
  },
  image: {
    width: 200,
    height: 200,
    marginRight: 10,
    borderRadius: 5,
  },
  estimateContainer: {
    marginVertical: 15,
  },
  estimateLabel: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 10,
  },
  estimateInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    marginBottom: 15,
  },
  estimateButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  estimateButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginRight: 10,
  },
  declineButtonText: {
    color: '#e74c3c',
    fontWeight: 'bold',
    fontSize: 16,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#2ecc71',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  completeButton: {
    backgroundColor: '#2ecc71',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  completeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  estimateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  estimateInfoLabel: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  estimateInfoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3498db',
    marginLeft: 10,
  },
  waitingText: {
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  paymentInfoLabel: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  paymentInfoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2ecc71',
    marginLeft: 10,
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentStatusText: {
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 10,
  },
});

export default ServiceRequestDetailsScreen;