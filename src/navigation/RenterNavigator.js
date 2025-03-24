import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import VehicleMapScreen from '../screens/renter/VehicleMapScreen';
import ChatListScreen from '../screens/common/ChatListScreen';

// Import Renter Screens
import RenterHomeScreen from '../screens/renter/RenterHomeScreen';
import VehicleSearchScreen from '../screens/renter/VehicleSearchScreen';
import MechanicSearchScreen from '../screens/renter/MechanicSearchScreen';
import BookingsScreen from '../screens/renter/BookingsScreen';
import RenterProfileScreen from '../screens/renter/RenterProfileScreen';

const Tab = createBottomTabNavigator();

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
      <Tab.Screen name="Find Mechanic" component={MechanicSearchScreen} />
      <Tab.Screen name="Bookings" component={BookingsScreen} />
      <Tab.Screen name="Profile" component={RenterProfileScreen} />
      <Tab.Screen 
        name="Map" 
        component={VehicleMapScreen} 
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
        component={ChatListScreen} 
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