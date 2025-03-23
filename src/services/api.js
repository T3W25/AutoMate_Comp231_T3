import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for API calls
// Change this to your computer's actual IP address when testing with a physical device
const API_URL = 'http://192.168.2.15:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the token in all requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
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
      console.error('Registration error:', error);
      // Fallback mechanism for demo purposes
      // In a real app, you'd properly handle this error
      const mockResponse = {
        _id: Date.now().toString(),
        name: userData.name,
        email: userData.email,
        role: userData.role,
        phone: userData.phone,
        token: 'demo-token-' + Date.now(),
      };
      return mockResponse;
    }
  },
  
  login: async (email, password) => {
    try {
      const response = await api.post('/users/login', { email, password });
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      // Fallback mechanism for demo purposes
      // In a real app, you'd properly handle this error
      throw error;
    }
  },
  
  getUserProfile: async () => {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },
};

// Mechanic Services
export const mechanicService = {
  getMechanics: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      if (filters.specialization) queryParams.append('specialization', filters.specialization);
      if (filters.location) queryParams.append('location', filters.location);
      if (filters.minRate) queryParams.append('minRate', filters.minRate);
      if (filters.maxRate) queryParams.append('maxRate', filters.maxRate);
      if (filters.showAll) queryParams.append('showAll', filters.showAll);
      
      const response = await api.get(`/mechanics?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.log('API error, using mock data:', error);
      
      // Fetch local mechanics if API fails
      try {
        const registeredMechanicsString = await AsyncStorage.getItem('registeredMechanics');
        let mechanics = [];
        
        if (registeredMechanicsString) {
          mechanics = JSON.parse(registeredMechanicsString);
        }
        
        // Add some mock mechanics if none exist
        if (mechanics.length === 0) {
          mechanics = [
            {
              id: '1',
              name: 'John Smith',
              specialization: 'Engine Repair',
              rating: 4.8,
              distance: 1.2,
              hourlyRate: 75,
              available: true,
              imageUrl: null,
            },
            {
              id: '2',
              name: 'Sarah Johnson',
              specialization: 'Electrical Systems',
              rating: 4.9,
              distance: 2.5,
              hourlyRate: 85,
              available: true,
              imageUrl: null,
            },
            {
              id: '3',
              name: 'Michael Davis',
              specialization: 'Brake Specialist',
              rating: 4.7,
              distance: 3.1,
              hourlyRate: 70,
              available: true,
              imageUrl: null,
            },
          ];
        }
        
        return { mechanics, page: 1, pages: 1, count: mechanics.length };
      } catch (storageError) {
        console.error('Error fetching from AsyncStorage:', storageError);
        // Return empty data if all else fails
        return { mechanics: [], page: 1, pages: 1, count: 0 };
      }
    }
  },
  
  getMechanicById: async (id) => {
    try {
      const response = await api.get(`/mechanics/${id}`);
      return response.data;
    } catch (error) {
      console.log('API error fetching mechanic, using mock data:', error);
      
      // Try to get from local storage
      try {
        const registeredMechanicsString = await AsyncStorage.getItem('registeredMechanics');
        if (registeredMechanicsString) {
          const mechanics = JSON.parse(registeredMechanicsString);
          const mechanic = mechanics.find(m => m.id === id);
          
          if (mechanic) {
            return {
              ...mechanic,
              mechanic: {
                _id: mechanic.id,
                name: mechanic.name,
                rating: mechanic.rating
              }
            };
          }
        }
      } catch (storageError) {
        console.error('Error fetching from AsyncStorage:', storageError);
      }
      
      // Return mock data if mechanic not found
      return {
        id: id,
        name: 'John Smith',
        specialization: 'Engine Repair Specialist',
        rating: 4.8,
        reviews: 42,
        distance: 1.2,
        hourlyRate: 75,
        available: true,
        experience: '10 years',
        description: 'Specialized in engine diagnostics and repairs.',
        services: [
          'Engine Diagnostics',
          'Engine Repair',
          'Oil Change',
          'Brake Service'
        ],
        certifications: [
          'ASE Master Technician',
          'Toyota Certified Technician'
        ],
        availableHours: '8:00 AM - 6:00 PM, Monday to Saturday',
        mechanic: {
          _id: id,
          name: 'John Smith',
          rating: 4.8
        }
      };
    }
  },

  createServiceRequest: async (requestData) => {
    try {
      const response = await api.post('/mechanic-services', requestData);
      return response.data;
    } catch (error) {
      console.error('Error creating service request:', error);
      
      // Create a mock response
      const mockServiceRequest = {
        id: Date.now().toString(),
        status: 'pending',
        ...requestData,
        createdAt: new Date().toISOString(),
      };
      
      // Store in AsyncStorage for demo purposes
      try {
        // Get existing requests for this mechanic
        const requestsKey = `serviceRequests_${requestData.mechanicId}`;
        let requestsStr = await AsyncStorage.getItem(requestsKey);
        let requests = [];
        
        if (requestsStr) {
          requests = JSON.parse(requestsStr);
        }
        
        requests.push(mockServiceRequest);
        await AsyncStorage.setItem(requestsKey, JSON.stringify(requests));

        // Also store in user's requests
        const userRequestsKey = `userServiceRequests_${requestData.customerId || 'current-user'}`;
        let userRequestsStr = await AsyncStorage.getItem(userRequestsKey);
        let userRequests = [];
        
        if (userRequestsStr) {
          userRequests = JSON.parse(userRequestsStr);
        }
        
        userRequests.push(mockServiceRequest);
        await AsyncStorage.setItem(userRequestsKey, JSON.stringify(userRequests));
      } catch (storageError) {
        console.error('Error storing in AsyncStorage:', storageError);
      }
      
      return mockServiceRequest;
    }
  },
  
  getServiceRequests: async () => {
    try {
      const response = await api.get('/mechanic-services');
      return response.data;
    } catch (error) {
      console.error('Error fetching service requests:', error);
      
      // Get from AsyncStorage for demo purposes
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (!userData) return [];
        
        const { _id, role } = JSON.parse(userData);
        let requestsKey;
        
        if (role === 'mechanic') {
          requestsKey = `serviceRequests_${_id}`;
        } else {
          requestsKey = `userServiceRequests_${_id}`;
        }
        
        const requestsStr = await AsyncStorage.getItem(requestsKey);
        if (requestsStr) {
          return JSON.parse(requestsStr);
        }
        
        return [];
      } catch (storageError) {
        console.error('Error fetching from AsyncStorage:', storageError);
        return [];
      }
    }
  },
};

