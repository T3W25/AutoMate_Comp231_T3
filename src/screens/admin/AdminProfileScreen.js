import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AdminProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [systemAlerts, setSystemAlerts] = useState(true);
  
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          setUserData(JSON.parse(userDataString));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userToken');
              await AsyncStorage.removeItem('userData');
              
              // Navigate back to the auth flow
              navigation.reset({
                index: 0,
                routes: [{ name: 'RoleSelect' }],
              });
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8e44ad" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Profile</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.profileImagePlaceholder}>
            <Ionicons name="person" size={60} color="#bdc3c7" />
          </View>
          
          <Text style={styles.userName}>{userData?.name}</Text>
          <Text style={styles.userRole}>Administrator</Text>
          
          <TouchableOpacity style={styles.editProfileButton}>
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>45</Text>
            <Text style={styles.statLabel}>Users</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>28</Text>
            <Text style={styles.statLabel}>Vehicles</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>32</Text>
            <Text style={styles.statLabel}>Services</Text>
          </View>
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.infoItem}>
            <Ionicons name="mail" size={20} color="#8e44ad" />
            <Text style={styles.infoText}>{userData?.email}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="call" size={20} color="#8e44ad" />
            <Text style={styles.infoText}>{userData?.phone}</Text>
          </View>
        </View>
        
        <View style={styles.preferencesSection}>
          <Text style={styles.sectionTitle}>Notification Preferences</Text>
          
          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceText}>Email Notifications</Text>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{ false: "#767577", true: "#d6a9e1" }}
              thumbColor={emailNotifications ? "#8e44ad" : "#f4f3f4"}
            />
          </View>
          
          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceText}>Push Notifications</Text>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: "#767577", true: "#d6a9e1" }}
              thumbColor={pushNotifications ? "#8e44ad" : "#f4f3f4"}
            />
          </View>
          
          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceText}>System Alerts</Text>
            <Switch
              value={systemAlerts}
              onValueChange={setSystemAlerts}
              trackColor={{ false: "#767577", true: "#d6a9e1" }}
              thumbColor={systemAlerts ? "#8e44ad" : "#f4f3f4"}
            />
          </View>
        </View>
        
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionItem}>
            <Ionicons name="shield-checkmark" size={20} color="#8e44ad" />
            <Text style={styles.actionText}>Security Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#7f8c8d" style={styles.itemArrow} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem}>
            <Ionicons name="help-circle" size={20} color="#8e44ad" />
            <Text style={styles.actionText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#7f8c8d" style={styles.itemArrow} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem}>
            <Ionicons name="document-text" size={20} color="#8e44ad" />
            <Text style={styles.actionText}>Terms & Conditions</Text>
            <Ionicons name="chevron-forward" size={20} color="#7f8c8d" style={styles.itemArrow} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem}>
            <Ionicons name="information-circle" size={20} color="#8e44ad" />
            <Text style={styles.actionText}>About</Text>
            <Ionicons name="chevron-forward" size={20} color="#7f8c8d" style={styles.itemArrow} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionItem, styles.logoutItem]} 
            onPress={handleLogout}
          >
            <Ionicons name="log-out" size={20} color="#e74c3c" />
            <Text style={[styles.actionText, styles.logoutText]}>Logout</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>AutoMate Admin v1.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#8e44ad',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    padding: 15,
  },
  profileSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#f1f2f6',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  userRole: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 15,
  },
  editProfileButton: {
    backgroundColor: '#e8daef',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  editProfileText: {
    color: '#8e44ad',
    fontWeight: 'bold',
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8e44ad',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#f1f2f6',
  },
  infoSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  preferencesSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionsSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  infoText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    color: '#2c3e50',
  },
  itemArrow: {
    marginLeft: 'auto',
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  preferenceText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  actionText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    color: '#2c3e50',
  },
  logoutItem: {
    borderBottomWidth: 0,
    marginTop: 10,
  },
  logoutText: {
    color: '#e74c3c',
  },
  versionInfo: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  versionText: {
    color: '#7f8c8d',
    fontSize: 14,
  },
});

export default AdminProfileScreen;