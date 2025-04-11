import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  onSnapshot, 
  arrayUnion, 
  serverTimestamp 
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Firebase config without storage bucket
const firebaseConfig = {
  apiKey: "AIzaSyBTVlA5PYjjvj9GPXglf4S6AznOc9VWMpA",
  authDomain: "automate-3024d.firebaseapp.com",
  projectId: "automate-3024d",
  messagingSenderId: "982174255887",
  appId: "1:982174255887:web:f235f493db7d48857a8c7a",
  measurementId: "G-6NBMFZ64HW"
};

// Initialize Firebase
let app;
let db;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log('Firebase Firestore initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
}

// Reference to conversations collection
const conversationsRef = collection(db, 'conversations');

// Constants for Cloudinary
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/image/upload';
const UPLOAD_PRESET = 'automate_chats'; // Create this preset in Cloudinary dashboard

/**
 * Initialize chat with another user and navigate to chat room
 * @param {Object} navigation - Navigation object
 * @param {string} otherUserId - The other user's ID
 * @param {string} otherUserName - The other user's name
 * @param {string} userRole - The role of the other user (mechanic, carOwner, renter)
 * @param {string} vehicleId - Optional vehicle ID if conversation is related to a vehicle
 * @returns {boolean} Success status
 */
export const initiateChat = async (navigation, otherUserId, otherUserName, userRole, vehicleId = null) => {
  try {
    // Get current user data
    const userDataString = await AsyncStorage.getItem('userData');
    if (!userDataString) {
      throw new Error('User data not found');
    }
    
    const userData = JSON.parse(userDataString);
    console.log('Initiating chat as:', userData.name, '(ID:', userData._id, ')');
    console.log('With user:', otherUserName, '(ID:', otherUserId, ')');
    
    // Define conversation keys for AsyncStorage
    const key1 = `chat_${userData._id}_${otherUserId}`;
    const key2 = `chat_${otherUserId}_${userData._id}`;
    
    // Check if conversation already exists in AsyncStorage
    let conversationStr = await AsyncStorage.getItem(key1);
    if (!conversationStr) {
      conversationStr = await AsyncStorage.getItem(key2);
    }
    
    let conversationId;
    if (conversationStr) {
      // Use existing conversation
      const conversation = JSON.parse(conversationStr);
      conversationId = conversation.id;
      console.log('Found existing conversation:', conversationId);
    }
    
    // Navigate to chat room with necessary params
    console.log('Navigating to ChatRoom with params:', {
      conversationId,
      otherUserId,
      otherUserName,
      vehicleId
    });
    
    navigation.navigate('ChatRoom', {
      conversationId,
      otherUserId,
      otherUserName: otherUserName || 'User',
      vehicleId
    });
    
    return true;
  } catch (error) {
    console.error('Error initiating chat:', error);
    Alert.alert('Error', 'Failed to start chat. Please try again.');
    return false;
  }
};

/**
 * Get a list of all conversations for a user
 * @param {string} userId - The user's ID
 * @returns {Array} Array of conversation objects
 */
export const getChatList = async (userId) => {
  try {
    console.log('Getting chat list for user:', userId);
    
    // Try to get conversations from Firebase first
    if (db) {
      try {
        const q = query(
          conversationsRef,
          where('participants', 'array-contains', userId),
          orderBy('lastMessageTimestamp', 'desc')
        );
        
        const snapshot = await getDocs(q);
        const conversations = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        console.log(`Found ${conversations.length} conversations in Firebase`);
        
        // Store conversations in AsyncStorage for offline access
        conversations.forEach(async (conversation) => {
          const key = `chat_${conversation.participants[0]}_${conversation.participants[1]}`;
          await AsyncStorage.setItem(key, JSON.stringify(conversation));
        });
        
        return conversations;
      } catch (firebaseError) {
        console.error('Firebase error getting chat list:', firebaseError);
        // Fall back to AsyncStorage on Firebase error
      }
    }
    
    // Fallback to AsyncStorage
    const allKeys = await AsyncStorage.getAllKeys();
    console.log('All AsyncStorage keys:', allKeys);
    
    const chatKeys = allKeys.filter(key => key.startsWith('chat_'));
    console.log('Chat keys found:', chatKeys);
    
    const chats = await Promise.all(
      chatKeys.map(async (key) => {
        try {
          const value = await AsyncStorage.getItem(key);
          return value ? JSON.parse(value) : null;
        } catch (e) {
          console.error(`Error parsing chat data for key ${key}:`, e);
          return null;
        }
      })
    );
    
    // Filter to only include chats that involve this user
    const userChats = chats
      .filter(chat => chat && chat.participants && chat.participants.includes(userId))
      .sort((a, b) => {
        // Sort by timestamp (most recent first)
        const dateA = new Date(a.lastMessageTimestamp || a.createdAt || 0);
        const dateB = new Date(b.lastMessageTimestamp || b.createdAt || 0);
        return dateB - dateA;
      });
    
    console.log(`Found ${userChats.length} conversations in AsyncStorage`);
    return userChats;
  } catch (error) {
    console.error('Error getting chat list:', error);
    return [];
  }
};

/**
 * Upload an image to Cloudinary
 * @param {string} uri - The local URI of the image
 * @param {string} conversationId - The conversation ID for reference
 * @returns {string} The download URL of the uploaded image
 */
export const uploadChatImage = async (uri, conversationId) => {
  try {
    console.log('Uploading image to Cloudinary:', uri.substring(0, 50) + '...');
    
    // Create a unique filename
    const filename = `chat_${conversationId}_${Date.now()}`;
    
    // Create form data for upload
    const formData = new FormData();
    
    // Get the file extension
    const uriParts = uri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    
    formData.append('file', {
      uri: uri,
      type: `image/${fileType || 'jpeg'}`,
      name: `${filename}.${fileType || 'jpg'}`
    });
    
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', 'chat_images');
    
    console.log('Sending image to Cloudinary...');
    
    // Upload to Cloudinary
    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data'
      }
    });
    
    const data = await response.json();
    
    if (data.secure_url) {
      console.log('Image uploaded successfully to Cloudinary:', data.secure_url);
      return data.secure_url;
    } else {
      console.error('Cloudinary upload failed:', data);
      // Return local URI as fallback
      return uri;
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    console.error('Error details:', JSON.stringify(error));
    // Return the local URI as fallback
    return uri;
  }
};

/**
 * Send a message in a conversation
 * @param {Object} conversation - The conversation object
 * @param {string} senderId - The sender's user ID
 * @param {string} senderName - The sender's name
 * @param {string} content - The message content
 * @param {string} imageUri - Optional image URI to include
 * @returns {Object} Updated conversation object
 */
export const sendMessage = async (conversation, senderId, senderName, content, imageUri = null) => {
  try {
    if (!senderId) {
      throw new Error('Sender ID is required');
    }
    
    if (!conversation || !conversation.participants) {
      throw new Error('Invalid conversation object');
    }
    
    console.log('Sending message:', {
      conversationId: conversation.id,
      hasText: !!content,
      hasImage: !!imageUri
    });
    
    let imageUrl = null;
    
    // If an image is included, upload it first
    if (imageUri) {
      try {
        imageUrl = await uploadChatImage(imageUri, conversation.id);
      } catch (uploadError) {
        console.error('Error uploading image, continuing with text only:', uploadError);
      }
    }
    
    // Create message object
    const messageId = Date.now().toString();
    const message = {
      id: messageId,
      sender: senderId,
      senderName: senderName,
      content: content || '',
      imageUrl: imageUrl,
      timestamp: new Date().toISOString(),
      read: false
    };
    
    // Create updated conversation
    const updatedConversation = {
      ...conversation,
      messages: [...(conversation.messages || []), message],
      lastMessage: {
        id: messageId,
        content: content || (imageUrl ? 'Sent an image' : ''),
        sender: senderId,
        hasImage: !!imageUrl,
        read: false
      },
      lastMessageTimestamp: new Date().toISOString()
    };
    
    // Find the other participant in the conversation
    const otherParticipant = conversation.participants.find(id => id !== senderId);
    if (!otherParticipant) {
      throw new Error('Could not find other participant in conversation');
    }
    
    // Define both possible conversation keys for AsyncStorage
    const key1 = `chat_${senderId}_${otherParticipant}`;
    const key2 = `chat_${otherParticipant}_${senderId}`;
    
    // Store in AsyncStorage (both keys to ensure both users can access)
    await AsyncStorage.setItem(key1, JSON.stringify(updatedConversation));
    await AsyncStorage.setItem(key2, JSON.stringify(updatedConversation));
    
    console.log(`Saved conversation to AsyncStorage with keys: ${key1} and ${key2}`);
    
    // Try to also update in Firebase if available
    if (db) {
      try {
        const conversationId = conversation.id;
        const firebaseMessage = {
          id: messageId,
          sender: senderId,
          senderName: senderName,
          content: content || '',
          imageUrl: imageUrl,
          timestamp: new Date(),
          read: false
        };
        
        const conversationRef = doc(db, 'conversations', conversationId);
        const conversationSnap = await getDoc(conversationRef);
        
        if (conversationSnap.exists()) {
          await updateDoc(conversationRef, {
            messages: arrayUnion(firebaseMessage),
            lastMessage: {
              content: imageUrl ? (content || 'Sent an image') : content,
              sender: senderId,
              timestamp: new Date(),
              hasImage: !!imageUrl
            },
            lastMessageTimestamp: serverTimestamp()
          });
        } else {
          // Create new document data with only defined fields
          const firestoreData = {
            id: conversation.id,
            participants: conversation.participants,
            participantNames: conversation.participantNames || {},
            participantRoles: conversation.participantRoles || {},
            messages: [firebaseMessage],
            lastMessage: {
              content: imageUrl ? (content || 'Sent an image') : (content || ''),
              sender: senderId,
              timestamp: new Date(),
              hasImage: !!imageUrl
            },
            lastMessageTimestamp: serverTimestamp(),
            createdAt: new Date()
          };
          
          // Only add vehicleId if it exists and is not undefined
          if (conversation.vehicleId) {
            firestoreData.vehicleId = conversation.vehicleId;
          }
          
          // Create a new conversation in Firebase
          await addDoc(conversationsRef, firestoreData);
        }
        
        console.log('Successfully updated conversation in Firebase');
      } catch (firebaseError) {
        // Silently fail on Firebase error as we've already saved to AsyncStorage
        console.log('Firebase update failed, using AsyncStorage only:', firebaseError);
      }
    }
    
    return updatedConversation;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Mark all unread messages in a conversation as read
 * @param {Object} conversation - The conversation object
 * @param {string} userId - The current user's ID
 * @returns {Object} Updated conversation
 */
export const markMessagesAsRead = async (conversation, userId) => {
  try {
    if (!conversation || !conversation.messages || !userId) {
      return conversation;
    }
    
    // Only mark messages as read if they're from the other user
    const hasUnreadMessages = conversation.messages.some(
      msg => msg.sender !== userId && !msg.read
    );
    
    if (!hasUnreadMessages) {
      return conversation;
    }
    
    // Update messages read status
    const updatedMessages = conversation.messages.map(msg => {
      if (msg.sender !== userId && !msg.read) {
        return { ...msg, read: true };
      }
      return msg;
    });
    
    // Create updated conversation object
    const updatedConversation = {
      ...conversation,
      messages: updatedMessages
    };
    
    // Update lastMessage.read if it was from the other user
    if (updatedConversation.lastMessage && 
        updatedConversation.lastMessage.sender !== userId) {
      updatedConversation.lastMessage.read = true;
    }
    
    // Find the other participant in the conversation
    const otherParticipant = conversation.participants.find(id => id !== userId);
    
    // Update in AsyncStorage
    if (otherParticipant) {
      const key1 = `chat_${userId}_${otherParticipant}`;
      const key2 = `chat_${otherParticipant}_${userId}`;
      
      await AsyncStorage.setItem(key1, JSON.stringify(updatedConversation));
      await AsyncStorage.setItem(key2, JSON.stringify(updatedConversation));
    }
    
    // Try to update in Firebase if available
    if (db && conversation.id) {
      try {
        const conversationRef = doc(db, 'conversations', conversation.id);
        const conversationSnap = await getDoc(conversationRef);
        
        if (conversationSnap.exists()) {
          // Update only the specific messages that need to be marked as read
          // This is a more complex operation in Firestore
          await updateDoc(conversationRef, {
            messages: updatedMessages
          });
        }
      } catch (firebaseError) {
        console.log('Firebase update failed when marking as read:', firebaseError);
      }
    }
    
    return updatedConversation;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return conversation;
  }
};

/**
 * Subscribe to changes in a conversation
 * @param {string} conversationId - The conversation ID
 * @param {Function} callback - Callback function when conversation updates
 * @returns {Function|null} Unsubscribe function or null if Firebase is not available
 */
export const subscribeToConversation = (conversationId, callback) => {
  if (!db) {
    console.log('Firebase not initialized, cannot subscribe to conversation');
    return null;
  }
  
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    
    return onSnapshot(conversationRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback(data);
      }
    }, error => {
      console.error('Error in conversation subscription:', error);
    });
  } catch (error) {
    console.error('Error setting up conversation subscription:', error);
    return null;
  }
};

export default {
  initiateChat,
  getChatList,
  uploadChatImage,
  sendMessage,
  markMessagesAsRead,
  subscribeToConversation
};