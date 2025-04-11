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
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../../services/api';

const RegisterScreen = ({ navigation, route }) => {
  const { role } = route.params;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Basic validation
    if (!name || !email || !phone || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
  
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
  
    setLoading(true);
    try {
      console.log('Sending registration data:', { name, email, role, phone });
      
      // Prepare the registration data
      const userData = {
        name,
        email,
        password,
        role,
        phone,
      };
      
      // Call the registration service
      const response = await authService.register(userData);
      
      if (!response || !response.token) {
        throw new Error('Registration failed - invalid response from server');
      }
      
      console.log('Registration successful:', response);
      
      // Store user data
      await AsyncStorage.setItem('userData', JSON.stringify(response));
      await AsyncStorage.setItem('userToken', response.token);
      
      // Navigate to Dashboard
      navigation.reset({
        index: 0,
        routes: [{ name: 'Dashboard', params: { role: response.role } }],
      });
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Unable to register. Please try again.';
      
      // Extract error message from response if available
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Registration Failed', errorMessage);
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
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Register as {role}</Text>
          <Text style={styles.subtitle}>{getRoleCaption()}</Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
          />

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
            placeholder="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
 
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
 
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
 
          <TouchableOpacity
            style={styles.button}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Register</Text>
            )}
          </TouchableOpacity>
 
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login', { role })}
            >
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
 
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Back to Role Selection</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#7f8c8d',
    fontSize: 16,
  },
  loginLink: {
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
 
 export default RegisterScreen;