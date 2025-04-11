import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import VehicleMapScreen from '../screens/renter/VehicleMapScreen';

// Import Renter Screens
import RenterHomeScreen from '../screens/renter/RenterHomeScreen';
import VehicleSearchScreen from '../screens/renter/VehicleSearchScreen';
import MechanicSearchScreen from '../screens/renter/MechanicSearchScreen';
import ServiceRequestScreen from '../screens/renter/ServiceRequestScreen';
import MechanicDetailsScreen from '../screens/renter/MechanicDetailsScreen';
import BookingsScreen from '../screens/renter/BookingsScreen';
import RenterProfileScreen from '../screens/renter/RenterProfileScreen';
import ChatRoomScreen from '../screens/common/ChatRoomScreen';
import ChatListScreen from '../screens/common/ChatListScreen';

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

// Create a stack navigator for the Map tab to include chat capability
const MapStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="VehicleMap" component={VehicleMapScreen} />
      <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
    </Stack.Navigator>
  );
};

const RenterNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search Cars') {
            iconName = focused ? 'car' : 'car-outline';
          } else if (route.name === 'Find Mechanic') {
            iconName = focused ? 'build' : 'build-outline';
          } else if (route.name === 'Bookings') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3498db',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={RenterHomeScreen} />
      <Tab.Screen name="Search Cars" component={VehicleSearchScreen} />
      <Tab.Screen name="Find Mechanic" component={MechanicStackNavigator} />  
      <Tab.Screen name="Bookings" component={BookingsScreen} />
      <Tab.Screen name="Profile" component={RenterProfileScreen} />
      <Tab.Screen 
        name="Map" 
        component={MapStackNavigator} 
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'map' : 'map-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Messages" 
        component={MessagesStackNavigator} 
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'chatbubbles' : 'chatbubbles-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default RenterNavigator;