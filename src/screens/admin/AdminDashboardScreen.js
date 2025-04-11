import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';


const AdminDashboardScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
    loadStats();
  }, []);

  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        setUserData(JSON.parse(userDataString));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadStats = async () => {
    try {
      // Try to fetch from API
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
      // Use placeholder data if API fails
      setStats({
        counts: {
          users: 45,
          vehicles: 28,
          bookings: 65,
          services: 32,
          renters: 25,
          carOwners: 15,
          mechanics: 5
        },
        recentUsers: [],
        recentBookings: []
      });
    } finally {
      setLoading(false);
    }
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
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>System Overview</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>System Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.counts.users}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.counts.vehicles}</Text>
              <Text style={styles.statLabel}>Vehicles</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.counts.bookings}</Text>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.counts.services}</Text>
              <Text style={styles.statLabel}>Service Requests</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Users')}
            >
              <Ionicons name="people" size={24} color="#8e44ad" />
              <Text style={styles.actionButtonText}>Manage Users</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Stats')}
            >
              <Ionicons name="stats-chart" size={24} color="#8e44ad" />
              <Text style={styles.actionButtonText}>View Analytics</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications" size={24} color="#8e44ad" />
              <Text style={styles.actionButtonText}>Send Notifications</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.userBreakdown}>
          <Text style={styles.sectionTitle}>User Distribution</Text>
          <View style={styles.userTypeContainer}>
            <View style={styles.userTypeItem}>
              <View style={[styles.userTypeIcon, { backgroundColor: '#3498db' }]}>
                <Ionicons name="car" size={20} color="white" />
              </View>
              <View style={styles.userTypeInfo}>
                <Text style={styles.userTypeLabel}>Renters</Text>
                <Text style={styles.userTypeCount}>{stats.counts.renters}</Text>
              </View>
            </View>
            
            <View style={styles.userTypeItem}>
              <View style={[styles.userTypeIcon, { backgroundColor: '#2ecc71' }]}>
                <Ionicons name="key" size={20} color="white" />
              </View>
              <View style={styles.userTypeInfo}>
                <Text style={styles.userTypeLabel}>Car Owners</Text>
                <Text style={styles.userTypeCount}>{stats.counts.carOwners}</Text>
              </View>
            </View>
            
            <View style={styles.userTypeItem}>
              <View style={[styles.userTypeIcon, { backgroundColor: '#e74c3c' }]}>
                <Ionicons name="build" size={20} color="white" />
              </View>
              <View style={styles.userTypeInfo}>
                <Text style={styles.userTypeLabel}>Mechanics</Text>
                <Text style={styles.userTypeCount}>{stats.counts.mechanics}</Text>
              </View>
            </View>
          </View>
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
  headerSubtitle: {
    fontSize: 16,
    color: '#e1bee7',
    marginTop: 5,
  },
  content: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  statsContainer: {
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8e44ad',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  quickActions: {
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
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  actionButtonText: {
    marginTop: 8,
    color: '#2c3e50',
    fontSize: 14,
    textAlign: 'center',
  },
  userBreakdown: {
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
  userTypeContainer: {
    marginTop: 10,
  },
  userTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  userTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userTypeInfo: {
    flex: 1,
  },
  userTypeLabel: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 5,
  },
  userTypeCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
});

export default AdminDashboardScreen;