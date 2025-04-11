import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

const UserManagementScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadUsers();
  }, [currentPage]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/users?page=${currentPage}&limit=15`);
      
      setUsers(response.data.users);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
      
      // Mock data for testing
      setUsers([
        { _id: '1', name: 'John Doe', email: 'john@example.com', role: 'renter', isActive: true },
        { _id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'carOwner', isActive: true },
        { _id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'mechanic', isActive: false },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    loadUsers();
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserPress = (user) => {
    navigation.navigate('UserDetail', { userId: user._id });
  };

  const toggleUserStatus = async (user) => {
    try {
      const response = await api.put(`/admin/users/${user._id}/status`, {
        isActive: !user.isActive,
      });
      
      // Update the user in the state
      setUsers(
        users.map((u) =>
          u._id === user._id ? { ...u, isActive: !u.isActive } : u
        )
      );
      
      Alert.alert(
        'Success',
        `User ${!user.isActive ? 'activated' : 'suspended'} successfully`
      );
    } catch (error) {
      console.error('Error toggling user status:', error);
      Alert.alert('Error', 'Failed to update user status');
    }
  };

  const deleteUser = async (user) => {
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
              
              // Remove the user from the state
              setUsers(users.filter((u) => u._id !== user._id));
              
              Alert.alert('Success', 'User deleted successfully');
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.userItem, !item.isActive && styles.inactiveUser]}
      onPress={() => handleUserPress(item)}
    >
      <View style={styles.userInfo}>
        <View style={styles.userNameContainer}>
          <Text style={styles.userName}>{item.name}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{item.role}</Text>
          </View>
        </View>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
      
      <View style={styles.userActions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            item.isActive ? styles.suspendButton : styles.activateButton,
          ]}
          onPress={() => toggleUserStatus(item)}
        >
          <Ionicons
            name={item.isActive ? 'close-circle' : 'checkmark-circle'}
            size={18}
            color="white"
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => deleteUser(item)}
        >
          <Ionicons name="trash" size={18} color="white" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>User Management</Text>
        <Text style={styles.headerSubtitle}>Manage system users</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#7f8c8d" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8e44ad" />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {!loading && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.pageButton, currentPage === 1 && styles.disabledButton]}
            onPress={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <Ionicons name="chevron-back" size={24} color={currentPage === 1 ? '#bdc3c7' : '#8e44ad'} />
          </TouchableOpacity>
          
          <Text style={styles.pageText}>
            Page {currentPage} of {totalPages}
          </Text>
          
          <TouchableOpacity
            style={[styles.pageButton, currentPage === totalPages && styles.disabledButton]}
            onPress={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <Ionicons name="chevron-forward" size={24} color={currentPage === totalPages ? '#bdc3c7' : '#8e44ad'} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  headerSubtitle: {
    fontSize: 16,
    color: '#e1bee7',
    marginTop: 5,
  },
  searchContainer: {
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 15,
  },
  userItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inactiveUser: {
    opacity: 0.7,
    borderLeftWidth: 3,
    borderLeftColor: '#e74c3c',
  },
  userInfo: {
    flex: 1,
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginRight: 10,
  },
  roleBadge: {
    backgroundColor: '#8e44ad',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  roleText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  userActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
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
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f1f2f6',
  },
  pageButton: {
    padding: 10,
  },
  disabledButton: {
    opacity: 0.5,
  },
  pageText: {
    marginHorizontal: 15,
    fontSize: 14,
    color: '#2c3e50',
  },
});

export default UserManagementScreen;