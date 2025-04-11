// src/components/Reviews.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getReviews } from '../services/reviewService';

const Reviews = ({ targetId, targetType }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    loadReviews();
  }, [targetId, targetType]);
  
  const loadReviews = async () => {
    try {
      setLoading(true);
      const result = await getReviews(targetType, targetId);
      setReviews(result);
      setError(null);
    } catch (error) {
      console.error('Error loading reviews:', error);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {item.user?.name ? item.user.name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          <View>
            <Text style={styles.userName}>{item.user?.name || 'Anonymous'}</Text>
            <Text style={styles.reviewDate}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map(star => (
            <Ionicons 
              key={star}
              name={item.rating >= star ? 'star' : 'star-outline'} 
              size={16} 
              color={item.rating >= star ? '#f39c12' : '#bdc3c7'} 
              style={styles.star}
            />
          ))}
        </View>
      </View>
      <Text style={styles.reviewComment}>{item.comment}</Text>
    </View>
  );
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#3498db" />
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadReviews}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reviews ({reviews.length})</Text>
      
      {reviews.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No reviews yet</Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          renderItem={renderReviewItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.reviewList}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#e74c3c',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#7f8c8d',
  },
  reviewList: {
    paddingBottom: 10,
  },
  reviewItem: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
    paddingBottom: 15,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f2f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7f8c8d',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  reviewDate: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  star: {
    marginLeft: 2,
  },
  reviewComment: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
  },
});

export default Reviews;