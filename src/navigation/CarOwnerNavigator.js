import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Import Car Owner Screens
import CarOwnerHomeScreen from '../screens/carOwner/CarOwnerHomeScreen';
import AddVehicleScreen from '../screens/carOwner/AddVehicleScreen';
import ManageVehiclesScreen from '../screens/carOwner/ManageVehiclesScreen';
import RentalRequestsScreen from '../screens/carOwner/RentalRequestsScreen';
import CarOwnerProfileScreen from '../screens/carOwner/CarOwnerProfileScreen';

// Import Mechanic-related screens
import MechanicSearchScreen from '../screens/renter/MechanicSearchScreen';
import MechanicDetailsScreen from '../screens/renter/MechanicDetailsScreen';
import ServiceRequestScreen from '../screens/renter/ServiceRequestScreen';

// Import Chat screens
import ChatListScreen from '../screens/common/ChatListScreen';
import ChatRoomScreen from '../screens/common/ChatRoomScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Create a stack navigator for the Mechanic tab
const MechanicStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MechanicSearch" component={MechanicSearchScreen} />
      <Stack.Screen name="MechanicDetails" component={MechanicDetailsScreen} />
      <Stack.Screen name="ServiceRequestScreen" component={ServiceRequestScreen} />
      <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
    </Stack.Navigator>
  );
};

// Create a stack navigator for Messages tab
const MessagesStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChatList" component={ChatListScreen} />
      <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
    </Stack.Navigator>
  );
};

const CarOwnerNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Add Vehicle') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'My Vehicles') {
            iconName = focused ? 'car' : 'car-outline';
          } else if (route.name === 'Requests') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Find Mechanic') {
            iconName = focused ? 'build' : 'build-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2ecc71',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={CarOwnerHomeScreen} />
      <Tab.Screen name="Add Vehicle" component={AddVehicleScreen} />
      <Tab.Screen name="My Vehicles" component={ManageVehiclesScreen} />
      <Tab.Screen name="Requests" component={RentalRequestsScreen} />
      <Tab.Screen name="Find Mechanic" component={MechanicStackNavigator} />
      <Tab.Screen name="Messages" component={MessagesStackNavigator} />
      <Tab.Screen name="Profile" component={CarOwnerProfileScreen} />
    </Tab.Navigator>
  );
};

export default CarOwnerNavigator;