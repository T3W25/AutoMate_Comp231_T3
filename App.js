import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import MechanicSearchScreen from './src/screens/renter/MechanicSearchScreen';
const Stack = createStackNavigator();
export default function App() {
  return (
    <NavigationContainer>
          <Stack.Navigator>
          <Stack.Screen name="MechanicSearch" component={MechanicSearchScreen} />
          </Stack.Navigator>
    </NavigationContainer>
  );
}


