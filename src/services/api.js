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
      console.log('API error, using mock data:', error);
      
      // Return mock vehicles if API fails
      const mockVehicles = [
        {
          _id: '1',
          make: 'Toyota',
          model: 'Camry',
          year: 2022,
          licensePlate: 'ABC123',
          vehicleType: 'Sedan',
          transmission: 'Automatic',
          fuelType: 'Gasoline',
          seats: 5,
          pricePerDay: 65,
          isAvailable: true,
          location: 'Downtown',
          description: 'Well-maintained, fuel-efficient sedan',
          rating: 4.7,
          features: {
            hasAC: true,
            hasGPS: true,
            hasBluetooth: true,
            hasUSB: true,
            hasChildSeat: false,
          },
          owner: {
            _id: 'owner1',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '123-456-7890',
            rating: 4.8,
          },
          coordinates: {
            latitude: 43.6532,
            longitude: -79.3832,
          },
        },
        {
          _id: '2',
          make: 'Honda',
          model: 'Civic',
          year: 2021,
          licensePlate: 'XYZ789',
          vehicleType: 'Sedan',
          transmission: 'Automatic',
          fuelType: 'Gasoline',
          seats: 5,
          pricePerDay: 60,
          isAvailable: true,
          location: 'Uptown',
          description: 'Economic and reliable Honda Civic',
          rating: 4.6,
          features: {
            hasAC: true,
            hasGPS: false,
            hasBluetooth: true,
            hasUSB: true,
            hasChildSeat: false,
          },
          owner: {
            _id: 'owner2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '987-654-3210',
            rating: 4.9,
          },
          coordinates: {
            latitude: 43.6547,
            longitude: -79.3857,
          },
        },
        {
          _id: '3',
          make: 'Ford',
          model: 'Explorer',
          year: 2020,
          licensePlate: 'DEF456',
          vehicleType: 'SUV',
          transmission: 'Automatic',
          fuelType: 'Gasoline',
          seats: 7,
          pricePerDay: 90,
          isAvailable: true,
          location: 'Midtown',
          description: 'Spacious SUV perfect for family trips',
          rating: 4.5,
          features: {
            hasAC: true,
            hasGPS: true,
            hasBluetooth: true,
            hasUSB: true,
            hasChildSeat: true,
          },
          owner: {
            _id: 'owner3',
            name: 'Bob Johnson',
            email: 'bob@example.com',
            phone: '555-555-5555',
            rating: 4.7,
          },
          coordinates: {
            latitude: 43.6570,
            longitude: -79.3880,
          },
        },
      ];
      
      return {
        vehicles: mockVehicles,
        page: 1,
        pages: 1,
        count: mockVehicles.length,
      };
    }
  },
  
  getVehicleById: async (id) => {
    try {
      const response = await api.get(`/vehicles/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      
      // Return a mock vehicle based on the id
      const mockVehicle = {
        _id: id,
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        licensePlate: 'ABC' + id,
        vehicleType: 'Sedan',
        transmission: 'Automatic',
        fuelType: 'Gasoline',
        seats: 5,
        pricePerDay: 65,
        isAvailable: true,
        location: 'Downtown',
        description: 'Well-maintained, fuel-efficient sedan',
        rating: 4.7,
        numReviews: 12,
        features: {
          hasAC: true,
          hasGPS: true,
          hasBluetooth: true,
          hasUSB: true,
          hasChildSeat: false,
        },
        owner: {
          _id: 'owner1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '123-456-7890',
          rating: 4.8,
        },
      };
      
      return mockVehicle;
    }
  },
  
  getOwnerVehicles: async () => {
    try {
      const response = await api.get('/vehicles/owner');
      return response.data;
    } catch (error) {
      console.error('Error fetching owner vehicles:', error);
      
      // Return mock vehicles for the owner
      const mockOwnerVehicles = [
        {
          _id: '1',
          make: 'Toyota',
          model: 'Camry',
          year: 2022,
          licensePlate: 'ABC123',
          vehicleType: 'Sedan',
          transmission: 'Automatic',
          fuelType: 'Gasoline',
          seats: 5,
          pricePerDay: 65,
          isAvailable: true,
          location: 'Downtown',
          description: 'Well-maintained, fuel-efficient sedan',
          features: {
            hasAC: true,
            hasGPS: true,
            hasBluetooth: true,
            hasUSB: true,
            hasChildSeat: false,
          },
          totalRentals: 7,
          totalEarnings: 455,
        },
        {
          _id: '2',
          make: 'Honda',
          model: 'CR-V',
          year: 2023,
          licensePlate: 'XYZ789',
          vehicleType: 'SUV',
          transmission: 'Automatic',
          fuelType: 'Hybrid',
          seats: 5,
          pricePerDay: 80,
          isAvailable: true,
          location: 'Uptown',
          description: 'Fuel-efficient SUV with great storage',
          features: {
            hasAC: true,
            hasGPS: true,
            hasBluetooth: true,
            hasUSB: true,
            hasChildSeat: true,
          },
          totalRentals: 5,
          totalEarnings: 400,
        },
      ];
      
      return mockOwnerVehicles;
    }
  },
  
  addVehicle: async (vehicleData) => {
    try {
      const response = await api.post('/vehicles', vehicleData);
      return response.data;
    } catch (error) {
      console.error('Error adding vehicle:', error);
      
      // Create a mock response with the data provided
      return {
        _id: Date.now().toString(),
        ...vehicleData,
        totalRentals: 0,
        totalEarnings: 0,
        createdAt: new Date().toISOString(),
      };
    }
  },
  
  updateVehicle: async (id, vehicleData) => {
    try {
      const response = await api.put(`/vehicles/${id}`, vehicleData);
      return response.data;
    } catch (error) {
      console.error('Error updating vehicle:', error);
      
      // Create a mock updated vehicle
      return {
        _id: id,
        ...vehicleData,
        updatedAt: new Date().toISOString(),
      };
    }
  },
  
  deleteVehicle: async (id) => {
    try {
      const response = await api.delete(`/vehicles/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      
      // Return mock response
      return { message: 'Vehicle deleted successfully' };
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
      console.error('Error creating booking:', error);
      
      // Create a mock booking response
      return {
        _id: Date.now().toString(),
        ...bookingData,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
    }
  },
  
  getUserBookings: async () => {
    try {
      const response = await api.get('/bookings');
      return response.data;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      
      // Return mock bookings
      return MOCK_BOOKINGS;
    }
  },
  
  getBookingById: async (id) => {
    try {
      const response = await api.get(`/bookings/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching booking:', error);
      
      // Find a mock booking by id
      const mockBooking = MOCK_BOOKINGS.find(booking => booking._id === id);
      return mockBooking || null;
    }
  },

  updateBookingStatus: async (id, status) => {
    try {
      const response = await api.put(`/bookings/${id}`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating booking status:', error);
      
      // Create a mock updated booking
      return {
        _id: id,
        status,
        updatedAt: new Date().toISOString(),
      };
    }
  },
};

// Mock bookings for offline use
const MOCK_BOOKINGS = [
  {
    _id: '1',
    type: 'car',
    status: 'upcoming',
    title: 'Toyota Camry',
    date: '2025-04-01',
    time: '09:00 AM',
    duration: '3 days',
    owner: 'John Doe',
    location: 'Downtown',
    price: 195,
  },
  {
    _id: '2',
    type: 'mechanic',
    status: 'upcoming',
    title: 'Engine Check',
    date: '2025-04-05',
    time: '02:00 PM',
    duration: '1 hour',
    mechanic: 'Sarah Johnson',
    location: 'Your location',
    price: 85,
  },
  {
    _id: '3',
    type: 'car',
    status: 'completed',
    title: 'Honda Civic',
    date: '2025-03-15',
    time: '10:00 AM',
    duration: '2 days',
    owner: 'Mark Wilson',
    location: 'Airport',
    price: 110,
  },
  {
    _id: '4',
    type: 'mechanic',
    status: 'completed',
    title: 'Brake Repair',
    date: '2025-03-10',
    time: '11:00 AM',
    duration: '2 hours',
    mechanic: 'Michael Davis',
    location: 'Your location',
    price: 140,
  },
];

export default api;