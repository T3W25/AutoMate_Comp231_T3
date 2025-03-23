import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ChatRoomScreen = ({ route, navigation }) => {
  const { conversationId, otherUserId, otherUserName, vehicleId } = route.params;
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [displayName, setDisplayName] = useState(otherUserName || 'User');
  
  const flatListRef = useRef(null);
  const messageSubscription = useRef(null);
  
  // Load user data and initialize chat
  useEffect(() => {
    loadUserData();
    return () => {
      if (messageSubscription.current) {
        messageSubscription.current();
      }
    };
  }, []);

  useEffect(() => {
    if (userData && otherUserId) {
      initializeChat();
    }
  }, [userData, otherUserId]);

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

  const initializeChat = async () => {
    try {
      setLoading(true);
      
      // Get or create conversation
      let currentConversation;
      
      if (conversationId) {
        // Try to load existing conversation from AsyncStorage
        const conversationKey = `chat_${userData._id}_${otherUserId}`;
        const conversationKey2 = `chat_${otherUserId}_${userData._id}`;
        
        let conversationStr = await AsyncStorage.getItem(conversationKey);
        if (!conversationStr) {
          conversationStr = await AsyncStorage.getItem(conversationKey2);
        }
        
        if (conversationStr) {
          currentConversation = JSON.parse(conversationStr);
        } else {
          // Create new conversation
          currentConversation = {
            id: conversationId,
            participants: [userData._id, otherUserId],
            participantNames: {
              [userData._id]: userData.name,
              [otherUserId]: displayName
            },
            messages: [],
            lastMessageTimestamp: new Date().toISOString()
          };
          
          await AsyncStorage.setItem(conversationKey, JSON.stringify(currentConversation));
        }
      } else {
        // Create new conversation
        const newConversationId = Date.now().toString();
        currentConversation = {
          id: newConversationId,
          participants: [userData._id, otherUserId],
          participantNames: {
            [userData._id]: userData.name,
            [otherUserId]: displayName
          },
          messages: [],
          lastMessageTimestamp: new Date().toISOString(),
          vehicleId: vehicleId
        };
        
        const conversationKey = `chat_${userData._id}_${otherUserId}`;
        await AsyncStorage.setItem(conversationKey, JSON.stringify(currentConversation));
      }
      
      setConversation(currentConversation);
      setMessages(currentConversation.messages || []);
      
      if (currentConversation.participantNames && currentConversation.participantNames[otherUserId]) {
        setDisplayName(currentConversation.participantNames[otherUserId]);
      }
      
      // Add polling for new messages (simulated subscription)
      const checkForNewMessages = setInterval(async () => {
        if (currentConversation && currentConversation.id) {
          const conversationKey = `chat_${userData._id}_${otherUserId}`;
          const conversationKey2 = `chat_${otherUserId}_${userData._id}`;
          
          let updatedConversationStr = await AsyncStorage.getItem(conversationKey);
          if (!updatedConversationStr) {
            updatedConversationStr = await AsyncStorage.getItem(conversationKey2);
          }
          
          if (updatedConversationStr) {
            const updatedConversation = JSON.parse(updatedConversationStr);
            if (updatedConversation.messages) {
              setMessages(updatedConversation.messages);
            }
          }
        }
      }, 2000); // Check every 2 seconds
      
      messageSubscription.current = () => clearInterval(checkForNewMessages);
      
      setLoading(false);
    } catch (error) {
      console.error('Error initializing chat:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to initialize chat. Please try again.');
    }
  };

  const handleSend = async () => {
    if (!messageText.trim()) return;
    
    try {
      const newMessage = {
        id: Date.now().toString(),
        sender: userData._id,
        senderName: userData.name,
        content: messageText.trim(),
        timestamp: new Date().toISOString(),
        read: false,
      };
      
      // Update conversation with new message
      const updatedMessages = [...messages, newMessage];
      
      // Update conversation in AsyncStorage
      const conversationKey = `chat_${userData._id}_${otherUserId}`;
      const conversationKey2 = `chat_${otherUserId}_${userData._id}`;
      
      let currentConversationStr = await AsyncStorage.getItem(conversationKey);
      let storageKey = conversationKey;
      
      if (!currentConversationStr) {
        currentConversationStr = await AsyncStorage.getItem(conversationKey2);
        storageKey = conversationKey2;
      }
      
      if (currentConversationStr) {
        const currentConversation = JSON.parse(currentConversationStr);
        
        currentConversation.messages = updatedMessages;
        currentConversation.lastMessage = {
          content: messageText.trim(),
          sender: userData._id,
          timestamp: new Date().toISOString()
        };
        currentConversation.lastMessageTimestamp = new Date().toISOString();
        
        await AsyncStorage.setItem(storageKey, JSON.stringify(currentConversation));
      }
      
      // Update local state
      setMessages(updatedMessages);
      setMessageText('');
      
      // Scroll to bottom
      if (flatListRef.current && updatedMessages.length > 0) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessageItem = ({ item }) => {
    const isOwnMessage = item.sender === userData._id;
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}>
        {!isOwnMessage && (
          <Text style={styles.senderName}>{item.senderName || displayName}</Text>
        )}
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {item.content}
          </Text>
        </View>
        <Text style={[
          styles.messageTime,
          isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
        ]}>
          {formatTimestamp(item.timestamp)}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chat</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{displayName}</Text>
      </View>
      
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => {
          if (messages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No messages yet</Text>
            <Text style={styles.emptyStateSubtext}>Start the conversation!</Text>
          </View>
        }
      />
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={messageText}
          onChangeText={setMessageText}
          multiline
        />
        <TouchableOpacity 
          style={styles.sendButton}
          onPress={handleSend}
          disabled={!messageText.trim()}
        >
          <Ionicons 
            name="send" 
            size={24} 
            color={messageText.trim() ? "#3498db" : "#b2c1d0"} 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#3498db',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 15,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 15,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 2,
    marginLeft: 12,
  },
  messageBubble: {
    borderRadius: 20,
    padding: 12,
  },
  ownMessageBubble: {
    backgroundColor: '#e1f5fe',
    borderBottomRightRadius: 5,
  },
  otherMessageBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 16,
  },
  ownMessageText: {
    color: '#2c3e50',
  },
  otherMessageText: {
    color: '#2c3e50',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 5,
  },
  ownMessageTime: {
    color: '#7f8c8d',
    alignSelf: 'flex-end',
  },
  otherMessageTime: {
    color: '#7f8c8d',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7f8c8d',
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#95a5a6',
    marginTop: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 10,
    padding: 10,
  },
});

export default ChatRoomScreen;