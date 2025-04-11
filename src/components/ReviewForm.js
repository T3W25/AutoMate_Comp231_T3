// src/components/ReviewForm.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createReview } from '../services/reviewService';

const ReviewForm = ({ 
  targetId, 
  targetType, 
  bookingId, 
  serviceId, 
  onClose, 
  onSuccess 
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }
    
    if (!comment.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }
    
    try {
      setLoading(true);
      
      const reviewData = {
        targetId,
        targetType,
        rating,
        comment,
      };
      
      if (bookingId) reviewData.bookingId = bookingId;
      if (serviceId) reviewData.serviceId = serviceId;
      
      await createReview(reviewData);
      
      Alert.alert(
        'Review Submitted',
        'Thank you for your feedback!',
        [{ text: 'OK', onPress: onClose }]
      );
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to submit review. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Leave a Review</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#7f8c8d" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.ratingLabel}>Rating</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map(star => (
              <TouchableOpacity 
                key={star}
                onPress={() => setRating(star)}
              >
                <Ionicons 
                  name={rating >= star ? 'star' : 'star-outline'} 
                  size={36} 
                  color={rating >= star ? '#f39c12' : '#bdc3c7'} 
                  style={styles.star}
                />
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={styles.commentLabel}>Comment</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Share your experience..."
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
          />
          
          <TouchableOpacity 
            style={[
              styles.submitButton,
              (rating === 0 || !comment.trim()) && styles.disabledButton
            ]}
            onPress={handleSubmit}
            disabled={loading || rating === 0 || !comment.trim()}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Review</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  closeButton: {
    padding: 5,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  star: {
    marginHorizontal: 5,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  commentInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#b2c1d0',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ReviewForm;