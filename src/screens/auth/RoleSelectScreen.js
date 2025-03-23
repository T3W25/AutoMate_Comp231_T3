import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

const RoleSelectScreen = ({ navigation }) => {
  const handleRoleSelect = (role) => {
    navigation.navigate('Login', { role });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AutoMate</Text>
        <Text style={styles.subtitle}>
          Your Comprehensive Automobile Assistance App
        </Text>
      </View>

      <View style={styles.roleContainer}>
        <Text style={styles.roleTitle}>Select Your Role</Text>

        <TouchableOpacity
          style={styles.roleButton}
          onPress={() => handleRoleSelect('renter')}
        >
          <Text style={styles.roleButtonText}>Renter</Text>
          <Text style={styles.roleDescription}>
            Find and rent vehicles or book mechanic services
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.roleButton}
          onPress={() => handleRoleSelect('carOwner')}
        >
          <Text style={styles.roleButtonText}>Car Owner</Text>
          <Text style={styles.roleDescription}>
            List your vehicle for rent and earn money
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.roleButton}
          onPress={() => handleRoleSelect('mechanic')}
        >
          <Text style={styles.roleButtonText}>Mechanic</Text>
          <Text style={styles.roleDescription}>
            Offer your repair services to customers
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.roleButton}
          onPress={() => handleRoleSelect('admin')}
        >
          <Text style={styles.roleButtonText}>Admin</Text>
          <Text style={styles.roleDescription}>
            Manage platform and monitor activities
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.roleButton}
          onPress={() => handleRoleSelect('funder')}
        >
          <Text style={styles.roleButtonText}>Funder</Text>
          <Text style={styles.roleDescription}>
            View financial analytics and reports
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#2c3e50',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#ecf0f1',
    textAlign: 'center',
  },
  roleContainer: {
    flex: 1,
    padding: 20,
  },
  roleTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2c3e50',
  },
  roleButton: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  roleButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  roleDescription: {
    fontSize: 14,
    color: '#7f8c8d',
  },
});

export default RoleSelectScreen;