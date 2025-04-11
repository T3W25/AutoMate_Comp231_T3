// src/services/notificationService.js
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register for push notifications
export const registerForPushNotifications = async () => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    // If permission hasn't been asked yet
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      return false;
    }
    
    // Get Expo push token
    const token = await Notifications.getExpoPushTokenAsync();
    
    // Send token to server
    await api.post('/users/push-token', { token: token.data });
    
    // Store token locally
    await AsyncStorage.setItem('pushToken', token.data);
    
    return true;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return false;
  }
};

// Get user notifications from API
export const getUserNotifications = async () => {
  try {
    const response = await api.get('/notifications');
    return response.data;
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await api.put(`/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Send local notification
export const sendLocalNotification = async (title, body, data = {}) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null, // Immediate notification
    });
    return true;
  } catch (error) {
    console.error('Error sending local notification:', error);
    return false;
  }
};

// Set up notification listeners
export const setupNotificationListeners = (navigation) => {
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    // Handle received notification
    console.log('Notification received:', notification);
  });
  
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    const { notification } = response;
    const data = notification.request.content.data;
    
    // Navigate based on notification type
    if (data.type === 'booking') {
      navigation.navigate('Bookings');
    } else if (data.type === 'service') {
      if (data.serviceId) {
        navigation.navigate('ServiceRequestDetails', { requestId: data.serviceId });
      } else {
        navigation.navigate('ServiceRequests');
      }
    } else if (data.type === 'chat') {
      navigation.navigate('ChatRoom', { 
        conversationId: data.conversationId,
        otherUserId: data.otherUserId 
      });
    }
  });
  
  return {
    notificationListener,
    responseListener,
    removeListeners: () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    }
  };
};