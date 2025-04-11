import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert
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
      
      // Add listener for screen focus to reload conversations
      const unsubscribe = navigation.addListener('focus', () => {
        loadConversations();
      });
      
      return unsubscribe;
    }
  }, [userData, navigation]);

  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        setUserData(JSON.parse(userDataString));
      } else {
        console.log('No user data found');
        setError('You need to be logged in to view conversations');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Failed to load user data');
    }
  };

  const loadConversations = async () => {
    if (!userData || !userData._id) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Get chat list from service
      console.log('Getting chat list for user:', userData._id);
      const chatList = await getChatList(userData._id);
      
      console.log(`Found ${chatList.length} conversations`);
      
      // Process conversations to ensure they have all required fields
      const processedChats = chatList.map(chat => {
        const otherParticipant = chat.participants.find(id => id !== userData._id);
        
        // Create a lastMessage object if it doesn't exist
        if (!chat.lastMessage && chat.messages && chat.messages.length > 0) {
          const lastMsg = chat.messages[chat.messages.length - 1];
          chat.lastMessage = {
            content: lastMsg.content || (lastMsg.imageUrl ? 'Sent an image' : ''),
            sender: lastMsg.sender,
            hasImage: !!lastMsg.imageUrl,
            read: lastMsg.read || false
          };
        }
        
        // If no participantNames, create an empty object
        if (!chat.participantNames) {
          chat.participantNames = {};
        }
        
        // If other participant name is missing, use a fallback name
        if (!chat.participantNames[otherParticipant]) {
          chat.participantNames[otherParticipant] = 'User';
        }
        
        return chat;
      });
      
      setConversations(processedChats);
      setError(null);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError('Failed to load conversations');
      Alert.alert('Error', 'Could not load your conversations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    
    // Invalid date
    if (isNaN(date.getTime())) return '';
    
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

  const getUserRoleIcon = (conversation, otherParticipant) => {
    // If we have role information, use it to determine icon
    if (conversation.participantRoles && conversation.participantRoles[otherParticipant]) {
      const role = conversation.participantRoles[otherParticipant];
      
      switch(role) {
        case 'mechanic':
          return <Ionicons name="build" size={16} color="#3498db" />;
        case 'carOwner':
          return <Ionicons name="car" size={16} color="#e74c3c" />;
        case 'renter':
          return <Ionicons name="key" size={16} color="#2ecc71" />;
        default:
          return null;
      }
    }
    
    // Otherwise, don't show a role icon
    return null;
  };

  const renderConversationItem = ({ item }) => {
    if (!item || !item.participants) {
      return null; // Skip invalid conversations
    }
    
    const otherParticipant = item.participants.find(id => id !== userData._id);
    if (!otherParticipant) {
      return null; // Skip conversations without other participant
    }
    
    // Define the last message details
    const lastMessage = item.lastMessage || {};
    const hasUnreadMessages = item.messages?.some(
      msg => !msg.read && msg.sender !== userData._id
    );
    
    return (
      <TouchableOpacity 
        style={styles.conversationItem}
        onPress={() => navigation.navigate('ChatRoom', { 
          conversationId: item.id,
          otherUserId: otherParticipant,
          otherUserName: item.participantNames?.[otherParticipant] || 'User',
          vehicleId: item.vehicleId,
        })}
      >
        <View style={styles.avatarContainer}>
          {item.participantImages && item.participantImages[otherParticipant] ? (
            <Image 
              source={{ uri: item.participantImages[otherParticipant] }} 
              style={styles.avatar} 
            />
          ) : (
            <Ionicons name="person" size={30} color="#bdc3c7" />
          )}
        </View>
        
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <View style={styles.nameContainer}>
              <Text style={styles.participantName}>
                {item.participantNames?.[otherParticipant] || 'User'}
              </Text>
              {getUserRoleIcon(item, otherParticipant)}
            </View>
            {item.lastMessageTimestamp && (
              <Text style={styles.messageTime}>
                {formatTimestamp(item.lastMessageTimestamp)}
              </Text>
            )}
          </View>
          
          {lastMessage.content || lastMessage.hasImage ? (
            <View style={styles.lastMessageContainer}>
              {lastMessage.hasImage && (
                <Ionicons name="image" size={14} color="#7f8c8d" style={styles.imageIcon} />
              )}
              <Text 
                style={[
                  styles.lastMessage,
                  hasUnreadMessages && styles.unreadMessage
                ]}
                numberOfLines={1}
              >
                {lastMessage.sender === userData._id ? 'You: ' : ''}
                {lastMessage.content || 'Sent an image'}
              </Text>
            </View>
          ) : (
            <Text style={styles.noMessages}>No messages yet</Text>
          )}
          
          {hasUnreadMessages && (
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
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.conversationsList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-ellipses" size={60} color="#bdc3c7" />
            <Text style={styles.emptyStateText}>No conversations yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start a chat by clicking the message button on a mechanic, vehicle, or booking page
            </Text>
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
    overflow: 'hidden',
  },
  avatar: {
    width: 50,
    height: 50,
  },
  conversationContent: {
    flex: 1,
    position: 'relative',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginRight: 5,
  },
  messageTime: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  lastMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageIcon: {
    marginRight: 5,
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
    fontWeight: 'bold'
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 20
  },
});

export default ChatListScreen;