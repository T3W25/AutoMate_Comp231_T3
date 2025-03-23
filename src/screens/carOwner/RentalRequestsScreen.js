import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Mock data for rental requests
const MOCK_REQUESTS = [
  {
    id: '1',
    status: 'pending',
    car: 'Toyota Camry (2022)',
    renter: 'John Smith',
    renterRating: 4.7,
    startDate: '2025-04-01',
    endDate: '2025-04-04',
    totalAmount: 195,
    requestDate: '2025-03-20',
  },
  {
    id: '2',
    status: 'approved',
    car: 'Honda Civic (2021)',
    renter: 'Sarah Johnson',
    renterRating: 4.9,
    startDate: '2025-04-10',
    endDate: '2025-04-11',
    totalAmount: 110,
    requestDate: '2025-03-15',
  },
  {
    id: '3',
    status: 'declined',
    car: 'Toyota Camry (2022)',
    renter: 'Michael Davis',
    renterRating: 4.2,
    startDate: '2025-03-25',
    endDate: '2025-03-27',
    totalAmount: 130,
    requestDate: '2025-03-10',
  },
  {
    id: '4',
    status: 'completed',
    car: 'Honda Civic (2021)',
    renter: 'Jessica Williams',
    renterRating: 4.8,
    startDate: '2025-03-01',
    endDate: '2025-03-03',
    totalAmount: 110,
    requestDate: '2025-02-20',
  },
];

const RentalRequestsScreen = () => {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'approved', 'completed', 'declined'
  const [requests, setRequests] = useState(MOCK_REQUESTS);
  
  const filteredRequests = requests.filter(request => request.status === activeTab);
  
  const handleApprove = (id) => {
    setRequests(
      requests.map(request => 
        request.id === id 
          ? { ...request, status: 'approved' } 
          : request
      )
    );
    
    Alert.alert('Success', 'Rental request approved successfully!');
  };
  
  const handleDecline = (id) => {
    Alert.alert(
      'Confirm Decline',
      'Are you sure you want to decline this rental request?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Decline',
          onPress: () => {
            setRequests(
              requests.map(request => 
                request.id === id 
                  ? { ...request, status: 'declined' } 
                  : request
              )
            );
          },
          style: 'destructive',
        },
      ]
    );
  };
  
  const renderRequestItem = ({ item }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View 
          style={[
            styles.statusBadge,
            item.status === 'pending' && styles.pendingBadge,
            item.status === 'approved' && styles.approvedBadge,
            item.status === 'completed' && styles.completedBadge,
            item.status === 'declined' && styles.declinedBadge,
          ]}
        >
          <Text style={styles.statusText}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
        <Text style={styles.requestDate}>Requested on {item.requestDate}</Text>
      </View>
      
      <View style={styles.requestContent}>
        <Text style={styles.carName}>{item.car}</Text>
        
        <View style={styles.renterInfo}>
          <Text style={styles.renterLabel}>Renter:</Text>
          <Text style={styles.renterName}>{item.renter}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#f39c12" />
            <Text style={styles.ratingText}>{item.renterRating}</Text>
          </View>
        </View>
        
        <View style={styles.dateContainer}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Start Date:</Text>
            <Text style={styles.dateValue}>{item.startDate}</Text>
          </View>
          
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>End Date:</Text>
            <Text style={styles.dateValue}>{item.endDate}</Text>
          </View>
        </View>
        
        <View style={styles.totalAmountContainer}>
          <Text style={styles.totalAmountLabel}>Total Amount:</Text>
          <Text style={styles.totalAmountValue}>${item.totalAmount}</Text>
        </View>
      </View>
      
      {item.status === 'pending' && (
        <View style={styles.requestActions}>
          <TouchableOpacity 
            style={styles.declineButton}
            onPress={() => handleDecline(item.id)}
          >
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.approveButton}
            onPress={() => handleApprove(item.id)}
          >
            <Text style={styles.approveButtonText}>Approve</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rental Requests</Text>
      </View>
      
      <View style={styles.tabsContainer}>
        {['pending', 'approved', 'completed', 'declined'].map((tab) => (
          <TouchableOpacity 
            key={tab}
            style={[
              styles.tab, 
              activeTab === tab && styles.activeTab
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab && styles.activeTabText
            ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.content}>
        {filteredRequests.length > 0 ? (
          <FlatList
            data={filteredRequests}
            renderItem={renderRequestItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.requestsList}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={60} color="#bdc3c7" />
            <Text style={styles.emptyStateText}>
              No {activeTab} rental requests found
            </Text>
          </View>
        )}
      </View>
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
    backgroundColor: '#2ecc71',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2ecc71',
  },
  tabText: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  activeTabText: {
    color: '#2ecc71',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  requestsList: {
    padding: 15,
  },
  requestCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  pendingBadge: {
    backgroundColor: '#f39c12',
  },
  approvedBadge: {
    backgroundColor: '#2ecc71',
  },
  completedBadge: {
    backgroundColor: '#3498db',
  },
  declinedBadge: {
    backgroundColor: '#e74c3c',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  requestDate: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  requestContent: {
    padding: 15,
  },
  carName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  renterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  renterLabel: {
    color: '#7f8c8d',
    marginRight: 5,
  },
  renterName: {
    fontWeight: 'bold',
    color: '#2c3e50',
    marginRight: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 5,
    color: '#7f8c8d',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    color: '#7f8c8d',
    marginBottom: 5,
  },
  dateValue: {
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  totalAmountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f1f2f6',
  },
  totalAmountLabel: {
    color: '#7f8c8d',
  },
  totalAmountValue: {
    fontWeight: 'bold',
    color: '#2ecc71',
    fontSize: 16,
  },
  requestActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f1f2f6',
  },
  declineButton: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    backgroundColor: '#fae9e8',
  },
  declineButtonText: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  approveButton: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    backgroundColor: '#c8f7d6',
  },
  approveButtonText: {
    color: '#2ecc71',
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#7f8c8d',
    marginVertical: 15,
    textAlign: 'center',
  },
});

export default RentalRequestsScreen;