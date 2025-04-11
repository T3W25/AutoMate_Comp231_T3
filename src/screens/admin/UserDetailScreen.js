import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

const UserDetailScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/users/${userId}`);
      setUser(response.data);
    } catch (error) {
      console.error('Error loading user details:', error);
      Alert.alert('Error', 'Failed to load user details');
      
      // Mock data for testing
      setUser({
        _id: userId,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'renter',
        phone: '+1234567890',
        isActive: true,
        createdAt: '2023-01-15T10:30:00Z',
        rating: 4.5,
        numReviews: 12,
        address: '123 Main St, Anytown, USA',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async () => {
    try {
      const response = await api.put(`/admin/users/${user._id}/status`, {
        isActive: !user.isActive,
      });
      
      setUser({
        ...user,
        isActive: !user.isActive,
      });
      
      Alert.alert(
        'Success',
        `User ${!user.isActive ? 'activated' : 'suspended'} successfully`
      );
    } catch (error) {
      console.error('Error toggling user status:', error);
      Alert.alert('Error', 'Failed to update user status');
    }
  };

  const deleteUser = async () => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/users/${user._id}`);
              Alert.alert('Success', 'User deleted successfully');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Details</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.userInfoCard}>
          <View style={styles.userHeader}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {user.name.substring(0, 2).toUpperCase()}
              </Text>
            </View>
            
            <View style={styles.userHeaderInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{user.role}</Text>
              </View>
              
              <View style={[
                styles.statusBadge,
                user.isActive ? styles.activeBadge : styles.inactiveBadge
              ]}>
                <Text style={styles.statusText}>
                  {user.isActive ? 'Active' : 'Suspended'}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.userDetailItem}>
            <Ionicons name="mail" size={20} color="#8e44ad" />
            <Text style={styles.userDetailText}>{user.email}</Text>
          </View>
          
          <View style={styles.userDetailItem}>
            <Ionicons name="call" size={20} color="#8e44ad" />
            <Text style={styles.userDetailText}>{user.phone}</Text>
          </View>
          
          {user.address && (
            <View style={styles.userDetailItem}>
              <Ionicons name="location" size={20} color="#8e44ad" />
              <Text style={styles.userDetailText}>{user.address}</Text>
            </View>
          )}
          
          <View style={styles.userDetailItem}>
            <Ionicons name="calendar" size={20} color="#8e44ad" />
            <Text style={styles.userDetailText}>
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </Text>
          </View>
          
          {user.rating && (
            <View style={styles.userDetailItem}>
              <Ionicons name="star" size={20} color="#8e44ad" />
              <Text style={styles.userDetailText}>
                {user.rating.toFixed(1)} ({user.numReviews} reviews)
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              user.isActive ? styles.suspendButton : styles.activateButton,
            ]}
            onPress={toggleUserStatus}
          >
            <Ionicons
              name={user.isActive ? 'close-circle' : 'checkmark-circle'}
              size={20}
              color="white"
            />
            <Text style={styles.actionButtonText}>
              {user.isActive ? 'Suspend User' : 'Activate User'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={deleteUser}
          >
            <Ionicons name="trash" size={20} color="white" />
            <Text style={styles.actionButtonText}>Delete User</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity & Statistics</Text>
          <Text style={styles.emptyStateText}>No activity data available</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    padding: 15,
  },
  userInfoCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#8e44ad',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userHeaderInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: '#8e44ad',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 5,
  },
  roleText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBadge: {
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  activeBadge: {
    backgroundColor: '#2ecc71',
  },
  inactiveBadge: {
    backgroundColor: '#e74c3c',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userDetailText: {
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 15,
  },
  actionsContainer: {
    marginBottom: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  suspendButton: {
    backgroundColor: '#e74c3c',
  },
  activateButton: {
    backgroundColor: '#2ecc71',
  },
  deleteButton: {
    backgroundColor: '#7f8c8d',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
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
  emptyStateText: {
    fontSize: 16,
    color: '#7f8c8d',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default UserDetailScreen;