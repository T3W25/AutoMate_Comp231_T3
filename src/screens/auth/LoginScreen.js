import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

const LoginScreen = ({ navigation, route }) => {
  const { role } = route.params;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Basic validation
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/users/login', {
        email,
        password,
      });

      const userData = response.data;

      // Check if the role matches
      if (userData.role !== role) {
        Alert.alert(
          'Role Mismatch',
          `You are registered as a ${userData.role}. Please login with the correct role.`
        );
        setLoading(false);
        return;
      }

      // Store user data and token
      await AsyncStorage.setItem('userToken', userData.token);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));

      // Navigate to Dashboard
      navigation.reset({
        index: 0,
        routes: [{ name: 'Dashboard', params: { role: userData.role } }],
      });
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        'Login Failed',
        error.response?.data?.message || 'Unable to login. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getRoleCaption = () => {
    switch (role) {
      case 'renter':
        return 'Rent vehicles and find mechanics';
      case 'carOwner':
        return 'List your vehicle for rent';
      case 'mechanic':
        return 'Offer your repair services';
      case 'admin':
        return 'Manage the platform';
      case 'funder':
        return 'Monitor financial performance';
      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Login as {role}</Text>
        <Text style={styles.subtitle}>{getRoleCaption()}</Text>
      </View>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Register', { role })}
          >
            <Text style={styles.registerLink}>Register</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back to Role Selection</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
    textTransform: 'capitalize',
  },
  subtitle: {
    fontSize: 14,
    color: '#ecf0f1',
  },
  formContainer: {
    padding: 20,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3498db',
    borderRadius: 5,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    color: '#7f8c8d',
    fontSize: 16,
  },
  registerLink: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
  },
});

export default LoginScreen;