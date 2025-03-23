import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ServiceRequestTracker = ({ navigation, userData }) => {
  const [serviceRequests, setServiceRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServiceRequests();
  }, [userData]);

  const loadServiceRequests = async () => {
    if (!userData || !userData._id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Load from AsyncStorage
      const userRequestsKey = `userServiceRequests_${userData._id}`;
      const requestsStr = await AsyncStorage.getItem(userRequestsKey);
      
      if (requestsStr) {
        const requests = JSON.parse(requestsStr);
        // Sort by date (most recent first)
        requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setServiceRequests(requests);
      } else {
        setServiceRequests([]);
      }
    } catch (error) {
      console.error('Error loading service requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContactMechanic = async (request) => {
    try {
      // Get or create chat conversation
      const conversationKey = `chat_${userData._id}_${request.mechanicId}`;
      let conversationStr = await AsyncStorage.getItem(conversationKey);
      
      if (!conversationStr) {
        // Try reverse order key
        const reverseKey = `chat_${request.mechanicId}_${userData._id}`;
        conversationStr = await AsyncStorage.getItem(reverseKey);
      }
      
      let conversation;
      if (conversationStr) {
        conversation = JSON.parse(conversationStr);
      } else {
        // Create a new conversation
        conversation = {
          id: Date.now().toString(),
          participants: [userData._id, request.mechanicId],
          participantNames: {
            [userData._id]: userData.name,
            [request.mechanicId]: request.mechanicName || 'Mechanic'
          },
          messages: [],
          lastMessageTimestamp: new Date().toISOString()
        };
        
        await AsyncStorage.setItem(conversationKey, JSON.stringify(conversation));
      }
      
      // Navigate to chat room
      navigation.navigate('ChatRoom', {
        conversationId: conversation.id,
        otherUserId: request.mechanicId,
        otherUserName: request.mechanicName || 'Mechanic'
      });
    } catch (error) {
      console.error('Error preparing chat:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Ionicons name="time" size={20} color="#f39c12" />;
      case 'accepted':
        return <Ionicons name="checkmark-circle" size={20} color="#27ae60" />;
      case 'completed':
        return <Ionicons name="checkmark-done-circle" size={20} color="#3498db" />;
      case 'declined':
        return <Ionicons name="close-circle" size={20} color="#e74c3c" />;
      default:
        return <Ionicons name="help-circle" size={20} color="#7f8c8d" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Awaiting mechanic response';
      case 'accepted':
        return 'Mechanic has accepted your request';
      case 'completed':
        return 'Service completed';
      case 'declined':
        return 'Mechanic has declined your request';
      default:
        return 'Unknown status';
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const renderServiceRequest = ({ item }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.statusContainer}>
          {getStatusIcon(item.status)}
          <Text style={styles.statusText}>
            {getStatusText(item.status)}
          </Text>
        </View>
        <Text style={styles.dateText}>{formatDate(item.scheduledDate)}</Text>
      </View>
      
      <View style={styles.requestDetails}>
        <Text style={styles.serviceType}>{item.serviceType}</Text>
        <Text style={styles.vehicleType}>{item.vehicleType}</Text>
        
        {item.mechanicName && (
          <View style={styles.mechanicInfo}>
            <Text style={styles.mechanicLabel}>Mechanic:</Text>
            <Text style={styles.mechanicName}>{item.mechanicName}</Text>
          </View>
        )}
      </View>
      
      {item.status === 'accepted' && (
        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => handleContactMechanic(item)}
        >
          <Ionicons name="chatbubbles" size={16} color="white" />
          <Text style={styles.contactButtonText}>Contact Mechanic</Text>
        </TouchableOpacity>
      )}
      
      {item.isEmergency && (
        <View style={styles.emergencyTag}>
          <Ionicons name="warning" size={14} color="white" />
          <Text style={styles.emergencyText}>Emergency</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#3498db" />
      </View>
    );
  }

  if (serviceRequests.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No service requests yet</Text>
        <TouchableOpacity
          style={styles.findMechanicButton}
          onPress={() => navigation.navigate('Find Mechanic')}
        >
          <Text style={styles.findMechanicText}>Find a Mechanic</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={serviceRequests}
        renderItem={renderServiceRequest}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.requestsList}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
  },
  emptyText: {
    color: '#7f8c8d',
    marginBottom: 10,
  },
  findMechanicButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  findMechanicText: {
    color: 'white',
    fontWeight: 'bold',
  },
  requestsList: {
    paddingVertical: 5,
    paddingHorizontal: 5,
  },
  requestCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    width: 280,
    position: 'relative',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 5,
    fontSize: 12,
    color: '#7f8c8d',
  },
  dateText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  requestDetails: {
    marginBottom: 10,
  },
  serviceType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  vehicleType: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 10,
  },
  mechanicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mechanicLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginRight: 5,
  },
  mechanicName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 5,
  },
  contactButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  emergencyTag: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emergencyText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 3,
  },

});

export default ServiceRequestTracker;