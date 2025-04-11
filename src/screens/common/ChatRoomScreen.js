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
  Image,
  Modal,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { sendMessage, markMessagesAsRead, subscribeToConversation } from '../../services/chatService';

const ChatRoomScreen = ({ route, navigation }) => {
  const { conversationId, otherUserId, otherUserName, vehicleId } = route.params;
  
  // Log received parameters
  console.log('ChatRoomScreen params:', {
    conversationId,
    otherUserId,
    otherUserName,
    vehicleId
  });
  
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [displayName, setDisplayName] = useState(otherUserName || 'User');
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  
  const flatListRef = useRef(null);
  const messageCheckInterval = useRef(null);
  const firebaseSubscription = useRef(null);
  
  // Load user data and initialize chat
  useEffect(() => {
    loadUserData();
    requestImagePermissions();
    
    return () => {
      // Clean up intervals and subscriptions
      if (messageCheckInterval.current) {
        clearInterval(messageCheckInterval.current);
      }
      
      if (firebaseSubscription.current) {
        firebaseSubscription.current();
      }
    };
  }, []);

  useEffect(() => {
    if (userData && otherUserId) {
      initializeChat();
    }
  }, [userData, otherUserId]);

  const requestImagePermissions = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission not granted');
        Alert.alert(
          'Permission Needed', 
          'We need camera roll permission to upload images. Please enable it in settings.'
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const parsedUserData = JSON.parse(userDataString);
        console.log('Loaded user data:', { id: parsedUserData._id, name: parsedUserData.name });
        setUserData(parsedUserData);
      } else {
        console.error('No user data found in AsyncStorage');
        Alert.alert('Error', 'You must be logged in to use chat');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const initializeChat = async () => {
    try {
      setLoading(true);
      
      // Define both possible conversation keys
      const key1 = `chat_${userData._id}_${otherUserId}`;
      const key2 = `chat_${otherUserId}_${userData._id}`;
      
      // Try to load existing conversation
      let conversationStr = await AsyncStorage.getItem(key1);
      
      if (!conversationStr) {
        conversationStr = await AsyncStorage.getItem(key2);
      }
      
      let currentConversation;
      
      if (conversationStr) {
        // Existing conversation found
        currentConversation = JSON.parse(conversationStr);
        console.log('Loaded existing conversation:', currentConversation.id);
      } else {
        // Create new conversation
        const newConversationId = conversationId || `conv_${Date.now()}`;
        currentConversation = {
          id: newConversationId,
          participants: [userData._id, otherUserId],
          participantNames: {
            [userData._id]: userData.name,
            [otherUserId]: displayName
          },
          participantRoles: {
            [userData._id]: userData.role || 'unknown',
            [otherUserId]: route.params.userRole || 'unknown'
          },
          messages: [],
          lastMessageTimestamp: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        
        if (vehicleId) {
          currentConversation.vehicleId = vehicleId;
        }
        
        console.log('Created new conversation:', currentConversation.id);
        
        // Save to BOTH keys to ensure both users can access it
        await AsyncStorage.setItem(key1, JSON.stringify(currentConversation));
        await AsyncStorage.setItem(key2, JSON.stringify(currentConversation));
      }
      
      // Set state
      setConversation(currentConversation);
      setMessages(currentConversation.messages || []);
      
      if (currentConversation.participantNames && currentConversation.participantNames[otherUserId]) {
        setDisplayName(currentConversation.participantNames[otherUserId]);
      }
      
      // Mark messages as read
      try {
        const updatedConversation = await markMessagesAsRead(currentConversation, userData._id);
        if (updatedConversation && updatedConversation.messages) {
          setConversation(updatedConversation);
          setMessages(updatedConversation.messages);
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
      
      // Try to subscribe to Firebase updates
      try {
        if (currentConversation.id) {
          firebaseSubscription.current = subscribeToConversation(
            currentConversation.id,
            (updatedConversation) => {
              if (updatedConversation) {
                setConversation(prev => ({
                  ...prev,
                  messages: updatedConversation.messages || [],
                  lastMessage: updatedConversation.lastMessage,
                  lastMessageTimestamp: updatedConversation.lastMessageTimestamp
                }));
                setMessages(updatedConversation.messages || []);
              }
            }
          );
        }
      } catch (subscriptionError) {
        console.log('Could not subscribe to Firebase updates, using polling instead:', subscriptionError);
      }
      
      // Set up polling for new messages as a fallback
      if (!firebaseSubscription.current) {
        messageCheckInterval.current = setInterval(async () => {
          try {
            // Check for updated conversation
            let updatedStr = await AsyncStorage.getItem(key1);
            if (!updatedStr) {
              updatedStr = await AsyncStorage.getItem(key2);
            }
            
            if (updatedStr) {
              const updatedConvo = JSON.parse(updatedStr);
              if (updatedConvo.messages && 
                  JSON.stringify(updatedConvo.messages) !== JSON.stringify(messages)) {
                setMessages(updatedConvo.messages);
                setConversation(updatedConvo);
                
                // Mark messages as read
                try {
                  const markedConversation = await markMessagesAsRead(updatedConvo, userData._id);
                  if (markedConversation !== updatedConvo) {
                    await AsyncStorage.setItem(key1, JSON.stringify(markedConversation));
                    await AsyncStorage.setItem(key2, JSON.stringify(markedConversation));
                  }
                } catch (error) {
                  console.error('Error marking messages as read:', error);
                }
              }
            }
          } catch (error) {
            console.error('Error checking for messages:', error);
          }
        }, 2000);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error initializing chat:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to initialize chat. Please try again.');
    }
  };

  const handlePickImage = async () => {
    try {
      // Ensure permissions are granted first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Needed',
          'We need access to your photos to attach images.'
        );
        return;
      }

      // Launch image picker with specific options
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      console.log('Image picker result:', result);
      
      // Check if the user canceled the operation
      if (result.canceled === true) {
        return;
      }
      
      // Handle result based on the version of ImagePicker
      if (result.assets && result.assets.length > 0) {
        // New version format
        setSelectedImage(result.assets[0].uri);
        setShowImagePreview(true);
      } else if (result.uri) {
        // Old version format
        setSelectedImage(result.uri);
        setShowImagePreview(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleSend = async () => {
    // Don't send empty messages
    if (!messageText.trim() && !selectedImage) {
      return;
    }
    
    try {
      setSendingMessage(true);
      
      // Make sure we have required data
      if (!userData || !userData._id || !otherUserId) {
        Alert.alert('Error', 'Missing user information. Please try again.');
        return;
      }
      
      // Make sure conversation exists
      if (!conversation) {
        console.error('No active conversation found');
        Alert.alert('Error', 'Unable to send message. Please try reopening the chat.');
        return;
      }
      
      console.log('Sending message:', {
        hasText: !!messageText,
        hasImage: !!selectedImage,
        conversationId: conversation.id
      });
      
      // Use the sendMessage function to send and save the message
      const updatedConversation = await sendMessage(
        conversation,
        userData._id,
        userData.name,
        messageText.trim(),
        selectedImage
      );
      
      // Update local state
      setConversation(updatedConversation);
      setMessages(updatedConversation.messages);
      setMessageText('');
      setSelectedImage(null);
      setShowImagePreview(false);
      
      // Scroll to bottom
      if (flatListRef.current && updatedConversation.messages.length > 0) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return '';
    }
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
          {item.imageUrl && (
            <TouchableOpacity 
              onPress={() => {
                setSelectedImage(item.imageUrl);
                setShowImagePreview(true);
              }}
            >
              <Image 
                source={{ uri: item.imageUrl }} 
                style={styles.messageImage} 
                resizeMode="cover" 
              />
            </TouchableOpacity>
          )}
          {item.content && (
            <Text style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText
            ]}>
              {item.content}
            </Text>
          )}
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
        keyExtractor={(item) => item.id || String(item.timestamp)}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => {
          if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: false });
          }
        }}
        onLayout={() => {
          if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: false });
          }
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No messages yet</Text>
            <Text style={styles.emptyStateSubtext}>Start the conversation!</Text>
          </View>
        }
      />
      
      {selectedImage && !showImagePreview && (
        <View style={styles.imagePreviewContainer}>
          <Image 
            source={{ uri: selectedImage }} 
            style={styles.imagePreviewThumbnail} 
          />
          <TouchableOpacity 
            style={styles.removeImageButton}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close-circle" size={20} color="white" />
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.inputContainer}>
        <TouchableOpacity 
          style={styles.attachButton}
          onPress={handlePickImage}
        >
          <Ionicons name="image" size={24} color="#3498db" />
        </TouchableOpacity>
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
          disabled={(!messageText.trim() && !selectedImage) || sendingMessage}
        >
          {sendingMessage ? (
            <ActivityIndicator size="small" color="#3498db" />
          ) : (
            <Ionicons 
              name="send" 
              size={24} 
              color={(messageText.trim() || selectedImage) ? "#3498db" : "#b2c1d0"} 
            />
          )}
        </TouchableOpacity>
      </View>
      
      {/* Image Preview Modal */}
      <Modal
        visible={showImagePreview}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImagePreview(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowImagePreview(false)}
            >
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
            {!messages.find(msg => msg.imageUrl === selectedImage) && (
              <TouchableOpacity 
                style={styles.modalSendButton}
                onPress={handleSend}
                disabled={sendingMessage}
              >
                {sendingMessage ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.modalSendButtonText}>Send</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
          <ScrollView 
            contentContainerStyle={styles.modalImageContainer}
            maximumZoomScale={3}
            minimumZoomScale={1}
          >
            <Image 
              source={{ uri: selectedImage }} 
              style={styles.modalImage}
              resizeMode="contain"
            />
          </ScrollView>
        </View>
      </Modal>
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
    overflow: 'hidden',
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
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 10,
    marginBottom: 6,
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
  attachButton: {
    padding: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    marginHorizontal: 8,
  },
  sendButton: {
    padding: 10,
  },
  imagePreviewContainer: {
    backgroundColor: '#e0e0e0',
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  imagePreviewThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 5,
  },
  removeImageButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  modalCloseButton: {
    padding: 5,
  },
  modalSendButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modalSendButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
});

export default ChatRoomScreen;