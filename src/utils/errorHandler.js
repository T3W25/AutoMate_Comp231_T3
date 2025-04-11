// src/utils/errorHandler.js
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
  
  // Log the error for debugging
  console.error('API Error:', error);
  
  // Extract error details if available
  if (error.response) {
    // Server responded with an error code
    if (error.response.data && error.response.data.message) {
      message = error.response.data.message;
    }
    
    // Check for authentication errors
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
    // Request was made but no response received
    isNetworkError = true;
    message = 'Unable to connect to the server. Please check your internet connection.';
  } else if (error.message) {
    // Error in setting up the request
    message = error.message;
    
    // Check if this is a network error
    if (message.includes('Network') || message.includes('connection')) {
      isNetworkError = true;
    }
  }
  
  // Show error message to user
  Alert.alert('Error', message);
  
  // Return error details
  const errorDetails = {
    message,
    isAuthError,
    isNetworkError,
  };
  
  // If it's an auth error, handle logout
  if (isAuthError) {
    handleAuthError();
  }
  
  // Run callback if provided
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
    // Clear auth tokens and user data
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
    
    // Navigate to login screen
    // Note: In a real app, you would use a navigation method
    // Since we can't directly access navigation here, you could:
    // 1. Use a state management library like Redux to trigger navigation
    // 2. Pass navigation as a parameter
    // 3. Use a callback function passed from the component
    
    // For now, we'll just set a flag that components can check
    await AsyncStorage.setItem('authRedirect', 'true');
    
    // Force app to reload (in a real app, use proper navigation)
    Alert.alert(
      'Session Expired',
      'Your session has expired. Please log in again.',
      [
        {
          text: 'OK',
          onPress: () => {
            // In a real app, this would navigate to login
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
    // Get existing failed operations
    const failedOpsStr = await AsyncStorage.getItem('failedOperations');
    const failedOps = failedOpsStr ? JSON.parse(failedOpsStr) : [];
    
    // Add new failed operation
    failedOps.push({
      type: operationType,
      data,
      timestamp: new Date().toISOString()
    });
    
    // Save updated list
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