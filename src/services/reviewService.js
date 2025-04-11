// src/services/reviewService.js
import api from './api';

export const createReview = async (reviewData) => {
  try {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
};

export const getReviews = async (targetType, targetId) => {
  try {
    const response = await api.get(`/reviews/${targetType}/${targetId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting reviews:', error);
    throw error;
  }
};