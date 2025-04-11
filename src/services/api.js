// services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Base URL for API calls - Update this to your actual backend URL
// For development on a physical device, use computer's IP address
const API_URL = 'http://192.168.2.15:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // Add timeout to prevent hanging requests
});

// Add a request interceptor to include the token in all requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error('Error getting token from storage:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle unauthorized errors (401)
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Redirect to login screen if token is invalid
      try {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userData');
        return Promise.reject(error);
      } catch (logoutError) {
        console.error('Error logging out:', logoutError);
        return Promise.reject(error);
      }
    }
    
    // Handle server errors (500)
    if (error.response && error.response.status >= 500) {
      console.error('Server error:', error.response.data);
    }
    
    // Handle network errors
    if (error.message === 'Network Error') {
      console.error('Network error - check your connection or server status');
    }
    
    return Promise.reject(error);
  }
);

// Authentication Services
export const authService = {
  register: async (userData) => {
    try {
      const response = await api.post('/users', userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      throw error;
    }
  },
  
  login: async (email, password) => {
    try {
      const response = await api.post('/users/login', { email, password });
      return response.data;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      throw error;
    }
  },
  
  getUserProfile: async () => {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error.response?.data || error.message);
      throw error;
    }
  },
};

// Mechanic Services
export const mechanicService = {
  getMechanics: async (filters = {}) => {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      if (filters.specialization) queryParams.append('specialization', filters.specialization);
      if (filters.location) queryParams.append('location', filters.location);
      if (filters.minRate) queryParams.append('minRate', filters.minRate);
      if (filters.maxRate) queryParams.append('maxRate', filters.maxRate);
      if (filters.showAll) queryParams.append('showAll', filters.showAll);
      if (filters.pageNumber) queryParams.append('pageNumber', filters.pageNumber);
      
      const response = await api.get(`/mechanics?${queryParams.toString()}`);
      console.log('API response for mechanics:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in getMechanics:', error.response?.data || error.message);
      
      // Fallback to AsyncStorage if API call fails
      try {
        console.log('Falling back to local mechanic data');
        const mechanicsStr = await AsyncStorage.getItem('registeredMechanics');
        if (mechanicsStr) {
          const mechanics = JSON.parse(mechanicsStr);
          console.log('Found local mechanics:', mechanics.length);
          return { mechanics };
        } else {
          console.log('No local mechanics found');
          return { mechanics: [] };
        }
      } catch (storageError) {
        console.error('Error accessing local storage:', storageError);
        return { mechanics: [] };
      }
    }
  },
  
  getMechanicById: async (id) => {
    try {
      const response = await api.get(`/mechanics/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error getting mechanic:', error.response?.data || error.message);
      throw error;
    }
  },

  createServiceRequest: async (formData) => {
    try {
      // Use FormData for file uploads
      const response = await api.post('/mechanic-services', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating service request:', error);
      throw error;
    }
  },
  
  getServiceRequests: async () => {
    try {
      const response = await api.get('/mechanic-services');
      return response.data;
    } catch (error) {
      console.error('Error getting service requests:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // NEW METHOD: Get User-specific Service Requests
  getUserServiceRequests: async () => {
    try {
      const response = await api.get('/mechanic-services/user');
      return response.data;
    } catch (error) {
      console.error('Error getting user service requests:', error);
      throw error;
    }
  },
  
  getServiceRequestById: async (id) => {
    try {
      const response = await api.get(`/mechanic-services/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error getting service request:', error.response?.data || error.message);
      throw error;
    }
  },
  
  updateServiceRequestStatus: async (id, status, totalAmount = null) => {
    try {
      const data = { status };
      if (totalAmount !== null) {
        data.totalAmount = totalAmount;
      }
      
      const response = await api.put(`/mechanic-services/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating service request:', error.response?.data || error.message);
      throw error;
    }
  },

  updateRequestStatus: async (id, status) => {
    try {
      const response = await api.put(`/mechanic-services/${id}`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating request status:', error);
      throw error;
    }
  },
  
  updateMechanicProfile: async (profileData) => {
    try {
      // Check network connectivity first
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        throw new Error('No internet connection');
      }

      // Ensure specialization is an array
      if (!Array.isArray(profileData.specialization)) {
        profileData.specialization = [profileData.specialization];
      }

      // Send request
      const response = await api.post('/mechanics/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating mechanic profile:', error);
      
      // Detailed error logging
      if (error.response) {
        // The request was made and the server responded with a status code
        console.error('Server responded with error:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to update profile');
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        throw new Error('No response from server. Check your internet connection.');
      } else {
        // Something happened in setting up the request
        console.error('Error setting up request:', error.message);
        throw error;
      }
    }
  },
  
  provideEstimate: async (requestId, estimatedAmount) => {
    try {
      const response = await api.put(`/mechanic-services/${requestId}/estimate`, {
        estimatedAmount,
      });
      return response.data;
    } catch (error) {
      console.error('Error providing estimate:', error);
      throw error;
    }
  },
  
  // Updated to match the requested method
  respondToEstimate: async (requestId, response) => {
    try {
      const result = await api.put(`/mechanic-services/${requestId}/response`, {
        response, // 'accept' or 'decline'
      });
      return result.data;
    } catch (error) {
      console.error('Error responding to estimate:', error);
      throw error;
    }
  },
  
  // NEW METHOD: Complete Service Request
  completeServiceRequest: async (requestId, finalAmount) => {
    try {
      const response = await api.put(`/mechanic-services/${requestId}/complete`, {
        finalAmount,
      });
      return response.data;
    } catch (error) {
      console.error('Error completing service request:', error);
      throw error;
    }
  },
  
  // NEW METHOD: Process Service Payment
  processServicePayment: async (requestId, paymentDetails) => {
    try {
      const response = await api.post(`/mechanic-services/${requestId}/payment`, paymentDetails);
      return response.data;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  },
};

// Vehicle Services
export const vehicleService = {
  getVehicles: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      if (filters.make) queryParams.append('make', filters.make);
      if (filters.model) queryParams.append('model', filters.model);
      if (filters.location) queryParams.append('location', filters.location);
      if (filters.vehicleType) queryParams.append('vehicleType', filters.vehicleType);
      if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
      if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);
      if (filters.pageNumber) queryParams.append('pageNumber', filters.pageNumber);
      if (filters.showAll) queryParams.append('showAll', filters.showAll);
      
      const response = await api.get(`/vehicles?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error getting vehicles:', error.response?.data || error.message);
      throw error;
    }
  },
  
  getVehicleById: async (id) => {
    try {
      const response = await api.get(`/vehicles/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error getting vehicle:', error.response?.data || error.message);
      throw error;
    }
  },
  
  getOwnerVehicles: async () => {
    try {
      const response = await api.get('/vehicles/owner');
      return response.data;
    } catch (error) {
      console.error('Error getting owner vehicles:', error.response?.data || error.message);
      throw error;
    }
  },
  
  addVehicle: async (vehicleData) => {
    try {
      const response = await api.post('/vehicles', vehicleData);
      return response.data;
    } catch (error) {
      console.error('Error adding vehicle:', error.response?.data || error.message);
      throw error;
    }
  },
  
  updateVehicle: async (id, vehicleData) => {
    try {
      const response = await api.put(`/vehicles/${id}`, vehicleData);
      return response.data;
    } catch (error) {
      console.error('Error updating vehicle:', error.response?.data || error.message);
      throw error;
    }
  },
  
  deleteVehicle: async (id) => {
    try {
      const response = await api.delete(`/vehicles/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting vehicle:', error.response?.data || error.message);
      throw error;
    }
  },
};

// Booking Services
export const bookingService = {
  createBooking: async (bookingData) => {
    try {
      const response = await api.post('/bookings', bookingData);
      return response.data;
    } catch (error) {
      console.error('Error creating booking:', error.response?.data || error.message);
      throw error;
    }
  },
  
  getUserBookings: async () => {
    try {
      const response = await api.get('/bookings');
      return response.data;
    } catch (error) {
      console.error('Error getting bookings:', error.response?.data || error.message);
      throw error;
    }
  },
  
  getBookingById: async (id) => {
    try {
      const response = await api.get(`/bookings/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error getting booking:', error.response?.data || error.message);
      throw error;
    }
  },

  updateBookingStatus: async (id, status) => {
    try {
      const response = await api.put(`/bookings/${id}`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating booking status:', error.response?.data || error.message);
      throw error;
    }
  },
};

// Add a payment service
export const paymentService = {
  processPayment: async (paymentData) => {
    try {
      const response = await api.post('/payments', paymentData);
      return response.data;
    } catch (error) {
      console.error('Error processing payment:', error.response?.data || error.message);
      throw error;
    }
  },
  
  getPaymentMethods: async () => {
    try {
      const response = await api.get('/payments/methods');
      return response.data;
    } catch (error) {
      console.error('Error getting payment methods:', error.response?.data || error.message);
      // For now, return mock data until payment system is implemented
      return [
        {
          id: 'pm_1',
          type: 'card',
          brand: 'Visa',
          last4: '4242',
          expiryMonth: 12,
          expiryYear: 2025,
          isDefault: true,
        },
        {
          id: 'pm_2',
          type: 'card',
          brand: 'Mastercard',
          last4: '5555',
          expiryMonth: 10,
          expiryYear: 2024,
          isDefault: false,
        },
      ];
    }
  },
};

// Admin Services
export const adminService = {
  getUsers: async (page = 1, limit = 10) => {
    try {
      const response = await api.get(`/admin/users?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  },
  
  getUserById: async (userId) => {
    try {
      const response = await api.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  },
  
  updateUserStatus: async (userId, isActive) => {
    try {
      const response = await api.put(`/admin/users/${userId}/status`, { isActive });
      return response.data;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  },
  
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },
  
  getSystemStats: async (timeRange = 'today') => {
    try {
      const response = await api.get(`/admin/stats?range=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Error getting system stats:', error);
      throw error;
    }
  },
  
  sendNotification: async (notificationData) => {
    try {
      const response = await api.post('/admin/notifications', notificationData);
      return response.data;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  },
};

export default api;