import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Authentication Screens
import RoleSelectScreen from './src/screens/auth/RoleSelectScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';

// Vehicle Screens
import VehicleDetailsScreen from './src/screens/renter/VehicleDetailsScreen';
import VehicleSearchScreen from './src/screens/renter/VehicleSearchScreen';
import VehicleMapScreen from './src/screens/renter/VehicleMapScreen';

// Mechanic Screens
import MechanicDetailsScreen from './src/screens/renter/MechanicDetailsScreen';
import MechanicSearchScreen from './src/screens/renter/MechanicSearchScreen';
import ServiceRequestScreen from './src/screens/renter/ServiceRequestScreen';
import MechanicHomeScreen from './src/screens/mechanic/MechanicHomeScreen';
import MechanicProfileScreen from './src/screens/mechanic/MechanicProfileScreen';
import ServiceRequestsScreen from './src/screens/mechanic/ServiceRequestsScreen';
import ServiceRequestDetailsScreen from './src/screens/mechanic/ServiceRequestDetailsScreen';

// Car Owner Screens
import CarOwnerHomeScreen from './src/screens/carOwner/CarOwnerHomeScreen';
import AddVehicleScreen from './src/screens/carOwner/AddVehicleScreen';
import ManageVehiclesScreen from './src/screens/carOwner/ManageVehiclesScreen';
import RentalRequestsScreen from './src/screens/carOwner/RentalRequestsScreen';
import CarOwnerProfileScreen from './src/screens/carOwner/CarOwnerProfileScreen';

// Renter Screens
import RenterHomeScreen from './src/screens/renter/RenterHomeScreen';
import RenterProfileScreen from './src/screens/renter/RenterProfileScreen';
import BookingsScreen from './src/screens/renter/BookingsScreen';

// Common Screens
import ChatRoomScreen from './src/screens/common/ChatRoomScreen';
import ChatListScreen from './src/screens/common/ChatListScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="RoleSelect">
        {/* Auth Screens */}
        <Stack.Screen 
          name="RoleSelect" 
          component={RoleSelectScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Dashboard" 
          component={DashboardScreen}
          options={{ headerShown: false }}
        />
        
        {/* Renter Screens */}
        <Stack.Screen 
          name="RenterHome" 
          component={RenterHomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="VehicleSearch" 
          component={VehicleSearchScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="VehicleDetails" 
          component={VehicleDetailsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="VehicleMap" 
          component={VehicleMapScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="MechanicSearch" 
          component={MechanicSearchScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="MechanicDetails" 
          component={MechanicDetailsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ServiceRequest" 
          component={ServiceRequestScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Bookings" 
          component={BookingsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="RenterProfile" 
          component={RenterProfileScreen}
          options={{ headerShown: false }}
        />
        
        {/* Car Owner Screens */}
        <Stack.Screen 
          name="CarOwnerHome" 
          component={CarOwnerHomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="AddVehicle" 
          component={AddVehicleScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ManageVehicles" 
          component={ManageVehiclesScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="RentalRequests" 
          component={RentalRequestsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="CarOwnerProfile" 
          component={CarOwnerProfileScreen}
          options={{ headerShown: false }}
        />
        
        {/* Mechanic Screens */}
        <Stack.Screen 
          name="MechanicHome" 
          component={MechanicHomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="MechanicProfile" 
          component={MechanicProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ServiceRequests" 
          component={ServiceRequestsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ServiceRequestDetails" 
          component={ServiceRequestDetailsScreen}
          options={{ headerShown: false }}
        />
        
        {/* Common Screens */}
        <Stack.Screen 
          name="ChatRoom" 
          component={ChatRoomScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ChatList" 
          component={ChatListScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}