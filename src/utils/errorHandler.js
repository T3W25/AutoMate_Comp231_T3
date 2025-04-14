  
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

/**
 * Handles API errors in a consistent way
 * @param {Object} error - The error object from a caught exception
 * @param {string} defaultMessage - Default message to show if error details can't be extracted
 * @param {Function} callback - Optional callback to run after error is handled
 */
export const handleApiError = (error, defaultMessage = 'An error occurred', callback = null) => {
  let message = defaultMessage;
  let isAuthError = false;
  let isNetworkError = false;
  
  
  console.error('API Error:', error);
  
  
  if (error.response) {
  
    if (error.response.data && error.response.data.message) {
      message = error.response.data.message;
    }
    
  
    if (error.response.status === 401) {
      isAuthError = true;
      message = 'Your session has expired. Please log in again.';
    } else if (error.response.status === 403) {
      message = 'You do not have permission to perform this action.';
    } else if (error.response.status === 404) {
      message = 'The requested resource was not found.';
    } else if (error.response.status >= 500) {
      message = 'A server error occurred. Please try again later.';
    }
  } else if (error.request) {
  
    isNetworkError = true;
    message = 'Unable to connect to the server. Please check your internet connection.';
  } else if (error.message) {
  
    message = error.message;
    
  
    if (message.includes('Network') || message.includes('connection')) {
      isNetworkError = true;
    }
  }
  
  
  Alert.alert('Error', message);
  
  
  const errorDetails = {
    message,
    isAuthError,
    isNetworkError,
  };
  
  
  if (isAuthError) {
    handleAuthError();
  }
  
  
  if (callback) {
    callback(errorDetails);
  }
  
  return errorDetails;
};

/**
 * Handles authentication errors by logging out
 */
export const handleAuthError = async () => {
  try {
  
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
    
  
  
  
  
  
  
    
  
    await AsyncStorage.setItem('authRedirect', 'true');
    
  
    Alert.alert(
      'Session Expired',
      'Your session has expired. Please log in again.',
      [
        {
          text: 'OK',
          onPress: () => {
  
          }
        }
      ]
    );
  } catch (error) {
    console.error('Error during auth error handling:', error);
  }
};

/**
 * Saves failed operations for later retry
 * @param {string} operationType - Type of operation (e.g., 'booking', 'serviceRequest')
 * @param {Object} data - The data that failed to save
 */
export const saveFailedOperation = async (operationType, data) => {
  try {
  
    const failedOpsStr = await AsyncStorage.getItem('failedOperations');
    const failedOps = failedOpsStr ? JSON.parse(failedOpsStr) : [];
    
  
    failedOps.push({
      type: operationType,
      data,
      timestamp: new Date().toISOString()
    });
    
  
    await AsyncStorage.setItem('failedOperations', JSON.stringify(failedOps));
    
    return true;
  } catch (error) {
    console.error('Error saving failed operation:', error);
    return false;
  }
};

/**
 * Check if the device is currently online
 * @returns {Promise<boolean>} True if online, false otherwise
 */
export const isOnline = async () => {
  try {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected && netInfo.isInternetReachable;
  } catch (error) {
    console.error('Error checking network status:', error);
    return false;
  }
};