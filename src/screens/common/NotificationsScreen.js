// src/screens/common/NotificationsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getUserNotifications, markNotificationAsRead } from '../../services/notificationService';

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    loadNotifications();
  }, []);
  
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadNotifications();
    });
    return unsubscribe;
  }, [navigation]);
  
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const result = await getUserNotifications();
      setNotifications(result);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };
  
  const handleNotificationPress = async (notification) => {
    try {
      // Mark as read
      await markNotificationAsRead(notification._id);
      
      // Update local state
      setNotifications(notifications.map(n => 
        n._id === notification._id ? { ...n, isRead: true } : n
      ));
      
      // Navigate based on notification type
      if (notification.type === 'booking' && notification.data.bookingId) {
        navigation.navigate('BookingDetails', { bookingId: notification.data.bookingId });
      } else if (notification.type === 'service' && notification.data.serviceId) {
        navigation.navigate('ServiceRequestDetails', { requestId: notification.data.serviceId });
      } else if (notification.type === 'chat' && notification.data.conversationId) {
        navigation.navigate('ChatRoom', { 
          conversationId: notification.data.conversationId,
          otherUserId: notification.data.otherUserId 
        });
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };
  
  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.isRead && styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationIcon}>
        <Ionicons
          name={
            item.type === 'booking' ? 'calendar' :
            item.type === 'service' ? 'build' :
            item.type === 'payment' ? 'cash' :
            item.type === 'chat' ? 'chatbubbles' : 'notifications'
          }
          size={24}
          color={
            item.type === 'booking' ? '#3498db' :
            item.type === 'service' ? '#e74c3c' :
            item.type === 'payment' ? '#2ecc71' :
            item.type === 'chat' ? '#9b59b6' : '#f39c12'
          }
        />
      </View>
      <View style={styles.notificationContent}>
        <Text style={[
          styles.notificationTitle,
          !item.isRead && styles.unreadText
        ]}>
          {item.title}
        </Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </View>
      {!item.isRead && (
        <View style={styles.unreadDot} />
      )}
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.notificationsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#3498db']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={60} color="#bdc3c7" />
              <Text style={styles.emptyStateText}>No notifications yet</Text>
            </View>
          }
        />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationsList: {
    padding: 15,
  },
  notificationItem: {
    flexDirection: 'row',
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
  unreadNotification: {
    backgroundColor: '#f8f9fa',
    borderLeftWidth: 3,
    borderLeftColor: '#3498db',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f2f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 5,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  notificationTime: {
    fontSize: 12,
    color: '#95a5a6',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3498db',
    alignSelf: 'center',
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

export default NotificationsScreen;