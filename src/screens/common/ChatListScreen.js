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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getChatList } from '../../services/chatService';

const ChatListScreen = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (userData) {
      loadConversations();
    }
  }, [userData]);

  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        setUserData(JSON.parse(userDataString));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Failed to load user data.');
    }
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const chatList = await getChatList(userData._id);
      setConversations(chatList);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError('Failed to load conversations.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // Same day
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Within a week
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return days[date.getDay()];
    }
    
    // Older
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderConversationItem = ({ item }) => {
    const otherParticipant = item.participants.find(id => id !== userData._id);
    
    return (
      <TouchableOpacity 
        style={styles.conversationItem}
        onPress={() => navigation.navigate('ChatRoom', { 
          conversationId: item.id,
          otherUserId: otherParticipant,
          vehicleId: item.vehicleId,
        })}
      >
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={30} color="#bdc3c7" />
        </View>
        
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.participantName}>
              {item.participantNames?.[otherParticipant] || 'User'}
            </Text>
            {item.lastMessage && (
              <Text style={styles.messageTime}>
                {formatTimestamp(item.lastMessageTimestamp)}
              </Text>
            )}
          </View>
          
          {item.lastMessage ? (
            <Text 
              style={[
                styles.lastMessage,
                !item.lastMessage.read && item.lastMessage.sender !== userData._id && styles.unreadMessage
              ]}
              numberOfLines={1}
            >
              {item.lastMessage.sender === userData._id ? 'You: ' : ''}
              {item.lastMessage.content}
            </Text>
          ) : (
            <Text style={styles.noMessages}>No messages yet</Text>
          )}
          
          {!item.lastMessage?.read && item.lastMessage?.sender !== userData._id && (
            <View style={styles.unreadIndicator} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <FlatList
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.conversationsList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-ellipses" size={60} color="#bdc3c7" />
            <Text style={styles.emptyStateText}>No conversations yet</Text>
          </View>
        }
      />
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
    backgroundColor: '#3498db',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    padding: 15,
    backgroundColor: '#f8d7da',
    margin: 15,
    borderRadius: 10,
  },
  errorText: {
    color: '#721c24',
    textAlign: 'center',
  },
  conversationsList: {
    padding: 15,
  },
  conversationItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f1f2f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  participantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  messageTime: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  lastMessage: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  unreadMessage: {
    color: '#2c3e50',
    fontWeight: 'bold',
  },
  noMessages: {
    fontSize: 14,
    color: '#95a5a6',
    fontStyle: 'italic',
  },
  unreadIndicator: {
    position: 'absolute',
    right: 0,
    top: '50%',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3498db',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#7f8c8d',
    marginTop: 10,
  },
});

export default ChatListScreen;