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

  
const firebaseConfig = {
  apiKey: "AIzaSyBTVlA5PYjjvj9GPXglf4S6AznOc9VWMpA",
  authDomain: "automate-3024d.firebaseapp.com",
  projectId: "automate-3024d",
  messagingSenderId: "982174255887",
  appId: "1:982174255887:web:f235f493db7d48857a8c7a",
  measurementId: "G-6NBMFZ64HW"
};

  
let app;
let db;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log('Firebase Firestore initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
}

  
const conversationsRef = collection(db, 'conversations');

  
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
  
    const userDataString = await AsyncStorage.getItem('userData');
    if (!userDataString) {
      throw new Error('User data not found');
    }
    
    const userData = JSON.parse(userDataString);
    console.log('Initiating chat as:', userData.name, '(ID:', userData._id, ')');
    console.log('With user:', otherUserName, '(ID:', otherUserId, ')');
    
  
    const key1 = `chat_${userData._id}_${otherUserId}`;
    const key2 = `chat_${otherUserId}_${userData._id}`;
    
  
    let conversationStr = await AsyncStorage.getItem(key1);
    if (!conversationStr) {
      conversationStr = await AsyncStorage.getItem(key2);
    }
    
    let conversationId;
    if (conversationStr) {
  
      const conversation = JSON.parse(conversationStr);
      conversationId = conversation.id;
      console.log('Found existing conversation:', conversationId);
    }
    
  
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
        
  
        conversations.forEach(async (conversation) => {
          const key = `chat_${conversation.participants[0]}_${conversation.participants[1]}`;
          await AsyncStorage.setItem(key, JSON.stringify(conversation));
        });
        
        return conversations;
      } catch (firebaseError) {
        console.error('Firebase error getting chat list:', firebaseError);
  
      }
    }
    
  
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
    
  
    const userChats = chats
      .filter(chat => chat && chat.participants && chat.participants.includes(userId))
      .sort((a, b) => {
  
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
    
  
    const filename = `chat_${conversationId}_${Date.now()}`;
    
  
    const formData = new FormData();
    
  
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
  
      return uri;
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    console.error('Error details:', JSON.stringify(error));
  
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
    
  
    if (imageUri) {
      try {
        imageUrl = await uploadChatImage(imageUri, conversation.id);
      } catch (uploadError) {
        console.error('Error uploading image, continuing with text only:', uploadError);
      }
    }
    
  
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
    
  
    const otherParticipant = conversation.participants.find(id => id !== senderId);
    if (!otherParticipant) {
      throw new Error('Could not find other participant in conversation');
    }
    
  
    const key1 = `chat_${senderId}_${otherParticipant}`;
    const key2 = `chat_${otherParticipant}_${senderId}`;
    
  
    await AsyncStorage.setItem(key1, JSON.stringify(updatedConversation));
    await AsyncStorage.setItem(key2, JSON.stringify(updatedConversation));
    
    console.log(`Saved conversation to AsyncStorage with keys: ${key1} and ${key2}`);
    
  
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
          
  
          if (conversation.vehicleId) {
            firestoreData.vehicleId = conversation.vehicleId;
          }
          
  
          await addDoc(conversationsRef, firestoreData);
        }
        
        console.log('Successfully updated conversation in Firebase');
      } catch (firebaseError) {
  
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
    
  
    const hasUnreadMessages = conversation.messages.some(
      msg => msg.sender !== userId && !msg.read
    );
    
    if (!hasUnreadMessages) {
      return conversation;
    }
    
  
    const updatedMessages = conversation.messages.map(msg => {
      if (msg.sender !== userId && !msg.read) {
        return { ...msg, read: true };
      }
      return msg;
    });
    
  
    const updatedConversation = {
      ...conversation,
      messages: updatedMessages
    };
    
  
    if (updatedConversation.lastMessage && 
        updatedConversation.lastMessage.sender !== userId) {
      updatedConversation.lastMessage.read = true;
    }
    
  
    const otherParticipant = conversation.participants.find(id => id !== userId);
    
  
    if (otherParticipant) {
      const key1 = `chat_${userId}_${otherParticipant}`;
      const key2 = `chat_${otherParticipant}_${userId}`;
      
      await AsyncStorage.setItem(key1, JSON.stringify(updatedConversation));
      await AsyncStorage.setItem(key2, JSON.stringify(updatedConversation));
    }
    
  
    if (db && conversation.id) {
      try {
        const conversationRef = doc(db, 'conversations', conversation.id);
        const conversationSnap = await getDoc(conversationRef);
        
        if (conversationSnap.exists()) {
  
  
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