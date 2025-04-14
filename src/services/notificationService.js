  
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

  
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

  
export const registerForPushNotifications = async () => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
  
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      return false;
    }
    
  
    const token = await Notifications.getExpoPushTokenAsync();
    
  
    await api.post('/users/push-token', { token: token.data });
    
  
    await AsyncStorage.setItem('pushToken', token.data);
    
    return true;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return false;
  }
};

  
export const getUserNotifications = async () => {
  try {
    const response = await api.get('/notifications');
    return response.data;
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw error;
  }
};

  
export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await api.put(`/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

  
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

  
export const setupNotificationListeners = (navigation) => {
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
  
    console.log('Notification received:', notification);
  });
  
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    const { notification } = response;
    const data = notification.request.content.data;
    
  
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