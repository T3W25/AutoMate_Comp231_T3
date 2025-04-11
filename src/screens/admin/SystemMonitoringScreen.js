import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

const SystemMonitoringScreen = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('today'); 

  useEffect(() => {
    loadStats();
  }, [timeRange]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/stats?range=${timeRange}`);
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
      // Placeholder data for testing with proper structure
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
        revenue: {  
          total: 12500,
          carRentals: 8200,
          mechanicServices: 4300
        },
        activeUsers: 32,
        recentActivity: []
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
        <Text style={styles.headerTitle}>System Analytics</Text>
        <Text style={styles.headerSubtitle}>Monitor platform performance</Text>
      </View>

      <View style={styles.timeRangeSelector}>
        <TouchableOpacity
          style={[
            styles.timeRangeButton,
            timeRange === 'today' && styles.selectedTimeRange,
          ]}
          onPress={() => setTimeRange('today')}
        >
          <Text
            style={[
              styles.timeRangeText,
              timeRange === 'today' && styles.selectedTimeRangeText,
            ]}
          >
            Today
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.timeRangeButton,
            timeRange === 'week' && styles.selectedTimeRange,
          ]}
          onPress={() => setTimeRange('week')}
        >
          <Text
            style={[
              styles.timeRangeText,
              timeRange === 'week' && styles.selectedTimeRangeText,
            ]}
          >
            Week
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.timeRangeButton,
            timeRange === 'month' && styles.selectedTimeRange,
          ]}
          onPress={() => setTimeRange('month')}
        >
          <Text
            style={[
              styles.timeRangeText,
              timeRange === 'month' && styles.selectedTimeRangeText,
            ]}
          >
            Month
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.timeRangeButton,
            timeRange === 'year' && styles.selectedTimeRange,
          ]}
          onPress={() => setTimeRange('year')}
        >
          <Text
            style={[
              styles.timeRangeText,
              timeRange === 'year' && styles.selectedTimeRangeText,
            ]}
          >
            Year
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.counts.users}</Text>
              <Text style={styles.statLabel}>Users</Text>
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
              <Text style={styles.statLabel}>Services</Text>
            </View>
          </View>
        </View>

        <View style={styles.revenueContainer}>
          <Text style={styles.sectionTitle}>Revenue</Text>
          <View style={styles.revenueCard}>
            <Text style={styles.totalRevenueLabel}>Total Revenue</Text>
            <Text style={styles.totalRevenueAmount}>
                ${stats?.revenue?.total || 0}
            </Text>
            
            <View style={styles.revenueBreakdown}>
                <View style={styles.revenueItem}>
                    <View style={styles.revenueItemHeader}>
                    <View style={[styles.revenueColor, { backgroundColor: '#3498db' }]} />
                    <Text style={styles.revenueItemTitle}>Car Rentals</Text>
                    </View>
                    <Text style={styles.revenueItemAmount}>
                    ${stats?.revenue?.carRentals || 0}
                    </Text>
                </View>
                
                <View style={styles.revenueItem}>
                    <View style={styles.revenueItemHeader}>
                    <View style={[styles.revenueColor, { backgroundColor: '#e74c3c' }]} />
                    <Text style={styles.revenueItemTitle}>Mechanic Services</Text>
                    </View>
                    <Text style={styles.revenueItemAmount}>
                    ${stats?.revenue?.mechanicServices || 0}
                    </Text>
                </View>
            </View>
          </View>
        </View>

        <View style={styles.engagementContainer}>
          <Text style={styles.sectionTitle}>User Engagement</Text>
          <View style={styles.engagementCard}>
            <View style={styles.engagementHeader}>
              <View style={styles.engagementItem}>
                <Text style={styles.engagementNumber}>{stats.activeUsers}</Text>
                <Text style={styles.engagementLabel}>Active Users</Text>
              </View>
              
              <View style={styles.engagementItem}>
                <Text style={styles.engagementNumber}>{stats.counts.bookings}</Text>
                <Text style={styles.engagementLabel}>Transactions</Text>
              </View>
            </View>
            
            <View style={styles.engagementPlaceholder}>
              <Text style={styles.placeholderText}>
                Engagement graph will be displayed here
              </Text>
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
  timeRangeSelector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 10,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  timeRangeButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  selectedTimeRange: {
    backgroundColor: '#8e44ad',
  },
  timeRangeText: {
    color: '#7f8c8d',
    fontWeight: 'bold',
  },
  selectedTimeRangeText: {
    color: 'white',
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
  revenueContainer: {
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
  revenueCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
  },
  totalRevenueLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  totalRevenueAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8e44ad',
    textAlign: 'center',
    marginVertical: 10,
  },
  revenueBreakdown: {
    marginTop: 15,
  },
  revenueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  revenueItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  revenueColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  revenueItemTitle: {
    fontSize: 14,
    color: '#2c3e50',
  },
  revenueItemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  engagementContainer: {
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
  engagementCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
  },
  engagementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  engagementItem: {
    alignItems: 'center',
  },
  engagementNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8e44ad',
    marginBottom: 5,
  },
  engagementLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  engagementPlaceholder: {
    height: 150,
    backgroundColor: '#ecf0f1',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
});

export default SystemMonitoringScreen;