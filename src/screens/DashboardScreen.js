// src/screens/DashboardScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import role-specific navigators
import RenterNavigator from '../navigation/RenterNavigator';
import CarOwnerNavigator from '../navigation/CarOwnerNavigator';
import MechanicNavigator from '../navigation/MechanicNavigator';

// For other roles we'll add placeholders for now
const AdminDashboard = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Admin Dashboard</Text>
  </View>
);

const FunderDashboard = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Funder Dashboard</Text>
  </View>
);

const DashboardScreen = ({ route }) => {
  const { role } = route.params;

  // Render the appropriate dashboard based on user role
  const renderDashboardByRole = () => {
    switch (role) {
      case 'renter':
        return <RenterNavigator />;
      case 'carOwner':
        return <CarOwnerNavigator />;
      case 'mechanic':
        return <MechanicNavigator />;
      case 'admin':
        return <AdminDashboard />;
      case 'funder':
        return <FunderDashboard />;
      default:
        return (
          <View style={styles.container}>
            <Text style={styles.text}>Unknown Role</Text>
          </View>
        );
    }
  };

  return (
    <>
      {renderDashboardByRole()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
});

export default DashboardScreen;