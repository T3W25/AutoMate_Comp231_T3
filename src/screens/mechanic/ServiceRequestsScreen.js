import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mechanicService } from '../../services/api';

const ServiceRequestsScreen = ({ navigation }) => {
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'accepted', 'completed'
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    // Refresh requests when the screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      if (userData) {
        loadServiceRequests();
      }
    });

    return unsubscribe;
  }, [navigation, userData]);

  useEffect(() => {
    if (userData) {
      loadServiceRequests();
    }
  }, [userData, activeTab]);

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
      setLoading(true);
      if (!userData || !userData._id) {
        setLoading(false);
        return;
      }

      // Load service requests from AsyncStorage
      const requestsKey = `serviceRequests_${userData._id}`;
      const requestsStr = await AsyncStorage.getItem(requestsKey);
      
      if (requestsStr) {
        const allRequests = JSON.parse(requestsStr);
        // Filter by status
        const filteredRequests = allRequests.filter(req => req.status === activeTab);
        setRequests(filteredRequests);
      } else {
        setRequests([]);
      }
      
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error loading service requests:', error);
      setLoading(false);
      setRefreshing(false);
      Alert.alert('Error', 'Failed to load service requests.');
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadServiceRequests();
  };

  const handleViewRequest = (requestId) => {
    // Find the request
    const request = requests.find(r => r.id === requestId);
    if (request) {
      navigation.navigate('RequestDetails', { request });
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      // Find the request index
      const requestIndex = requests.findIndex(r => r.id === requestId);
      if (requestIndex === -1) return;

      const request = requests[requestIndex];

      // Update the request status in AsyncStorage
      await updateRequestStatus(request, 'accepted');

      // Remove from current list since we're on the pending tab
      setRequests(requests.filter(r => r.id !== requestId));

      // Send initial message to customer
      try {
        // Create a chat conversation
        const conversationId = Date.now().toString();
        const conversation = {
          id: conversationId,
          participants: [userData._id, request.customerId],
          participantNames: {
            [userData._id]: userData.name,
            [request.customerId]: request.customerName
          },
          messages: [],
          lastMessageTimestamp: new Date().toISOString()
        };
        
        const conversationKey = `chat_${userData._id}_${request.customerId}`;
        await AsyncStorage.setItem(conversationKey, JSON.stringify(conversation));
        
        // Send initial message
        const initialMessage = {
          id: Date.now().toString(),
          sender: userData._id,
          senderName: userData.name,
          content: `I've accepted your service request for ${request.serviceType}. I'll be arriving at the scheduled time.`,
          timestamp: new Date().toISOString(),
          read: false,
        };
        
        conversation.messages = [initialMessage];
        conversation.lastMessage = {
          content: initialMessage.content,
          sender: userData._id,
          timestamp: new Date().toISOString()
        };
        
        await AsyncStorage.setItem(conversationKey, JSON.stringify(conversation));
      } catch (chatError) {
        console.error('Error creating chat:', chatError);
      }

      Alert.alert('Success', 'Service request accepted successfully!');
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Failed to accept request. Please try again.');
    }
  };

  const handleDeclineRequest = async (requestId) => {
    Alert.alert(
      'Confirm Decline',
      'Are you sure you want to decline this service request?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Decline',
          onPress: async () => {
            try {
              // Find the request
              const request = requests.find(r => r.id === requestId);
              if (!request) return;

              // Update the request status in AsyncStorage
              await updateRequestStatus(request, 'declined');

              // Remove from current list
              setRequests(requests.filter(r => r.id !== requestId));

              Alert.alert('Success', 'Service request declined.');
            } catch (error) {
              console.error('Error declining request:', error);
              Alert.alert('Error', 'Failed to decline request. Please try again.');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const updateRequestStatus = async (request, newStatus) => {
    try {
      // Update mechanic's requests
      const mechanicRequestsKey = `serviceRequests_${userData._id}`;
      const mechanicRequestsStr = await AsyncStorage.getItem(mechanicRequestsKey);
      
      if (mechanicRequestsStr) {
        const mechanicRequests = JSON.parse(mechanicRequestsStr);
        const updatedMechanicRequests = mechanicRequests.map(req => 
          req.id === request.id ? { ...req, status: newStatus } : req
        );
        await AsyncStorage.setItem(mechanicRequestsKey, JSON.stringify(updatedMechanicRequests));
      }

      // Also update in customer's requests
      const customerRequestsKey = `userServiceRequests_${request.customerId}`;
      const customerRequestsStr = await AsyncStorage.getItem(customerRequestsKey);
      
      if (customerRequestsStr) {
        const customerRequests = JSON.parse(customerRequestsStr);
        const updatedCustomerRequests = customerRequests.map(req => 
          req.id === request.id ? { ...req, status: newStatus } : req
        );
        await AsyncStorage.setItem(customerRequestsKey, JSON.stringify(updatedCustomerRequests));
      }
    } catch (error) {
      console.error('Error updating request status:', error);
      throw error;
    }
  };

  const handleCompleteRequest = async (requestId) => {
    try {
      // Find the request
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      // Update the request status in AsyncStorage
      await updateRequestStatus(request, 'completed');

      // Remove from current list
      setRequests(requests.filter(r => r.id !== requestId));

      Alert.alert('Success', 'Service request marked as completed!');
    } catch (error) {
      console.error('Error completing request:', error);
      Alert.alert('Error', 'Failed to complete request. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const renderRequestItem = ({ item }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <Text style={styles.customerName}>{item.customerName}</Text>
        <View style={[
          styles.statusBadge,
          item.status === 'pending' && styles.pendingBadge,
          item.status === 'accepted' && styles.acceptedBadge,
          item.status === 'completed' && styles.completedBadge,
          item.status === 'declined' && styles.declinedBadge,
        ]}>
          <Text style={styles.statusText}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>
      
      <View style={styles.requestDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="car" size={16} color="#7f8c8d" />
            <Text style={styles.detailText}>{item.vehicleType}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="build" size={16} color="#7f8c8d" />
            <Text style={styles.detailText}>{item.serviceType}</Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar" size={16} color="#7f8c8d" />
            <Text style={styles.detailText}>
              {formatDate(item.scheduledDate)}
            </Text>
          </View>
        </View>
        
        <View style={styles.descriptionContainer}>
          <Text numberOfLines={2} style={styles.descriptionText}>
            {item.description}
          </Text>
        </View>
      </View>
      
      {item.isEmergency && (
        <View style={styles.emergencyBadge}>
          <Ionicons name="alert-circle" size={16} color="white" />
          <Text style={styles.emergencyText}>Emergency</Text>
        </View>
      )}
      
      {item.status === 'pending' && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.declineButton}
            onPress={() => handleDeclineRequest(item.id)}
          >
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.acceptButton}
            onPress={() => handleAcceptRequest(item.id)}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {item.status === 'accepted' && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => navigation.navigate('ChatRoom', {
              otherUserId: item.customerId,
              otherUserName: item.customerName
            })}
          >
            <Ionicons name="chatbubbles" size={16} color="#3498db" />
            <Text style={styles.contactButtonText}>Contact</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.completeButton}
            onPress={() => handleCompleteRequest(item.id)}
          >
            <Text style={styles.completeButtonText}>Mark Completed</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Service Requests</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e74c3c" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Service Requests</Text>
      </View>
      
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'pending' && styles.activeTab
          ]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'pending' && styles.activeTabText
          ]}>
            Pending
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'accepted' && styles.activeTab
          ]}
          onPress={() => setActiveTab('accepted')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'accepted' && styles.activeTabText
          ]}>
            Active
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
      
      <FlatList
        data={requests}
        renderItem={renderRequestItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.requestsList}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={60} color="#bdc3c7" />
            <Text style={styles.emptyStateText}>
              No {activeTab} service requests
            </Text>
          </View>
        }
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
    backgroundColor: '#e74c3c',
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#e74c3c',
  },
  tabText: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  activeTabText: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  requestsList: {
    padding: 15,
  },
  requestCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
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
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
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
  completedBadge: {
    backgroundColor: '#3498db',
  },
  declinedBadge: {
    backgroundColor: '#e74c3c',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  requestDetails: {
    padding: 15,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  detailText: {
    marginLeft: 5,
    color: '#7f8c8d',
  },
  descriptionContainer: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 5,
  },
  descriptionText: {
    color: '#2c3e50',
  },
  emergencyBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  emergencyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  actionsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f1f2f6',
  },
  declineButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  declineButtonText: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  acceptButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fadbd8',
  },
  acceptButtonText: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
  },
  contactButtonText: {
    color: '#3498db',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  completeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fadbd8',
  },
  completeButtonText: {
    color: '#e74c3c',
    fontWeight: 'bold',
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
    textAlign: 'center',
  },
});

export default ServiceRequestsScreen;