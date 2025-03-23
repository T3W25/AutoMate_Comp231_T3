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
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBTVlA5PYjjvj9GPXglf4S6AznOc9VWMpA",
  authDomain: "automate-3024d.firebaseapp.com",
  projectId: "automate-3024d",
  storageBucket: "automate-3024d.firebasestorage.app",
  messagingSenderId: "982174255887",
  appId: "1:982174255887:web:f235f493db7d48857a8c7a",
  measurementId: "G-6NBMFZ64HW"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Reference to conversations collection
const conversationsRef = collection(db, 'conversations');

/**
 * Get a list of all conversations for a user
 * @param {string} userId - The user's ID
 * @returns {Array} Array of conversation objects
 */
export const getChatList = async (userId) => {
  try {
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId),
      orderBy('lastMessageTimestamp', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting chat list:', error);
    throw error;
  }
};

/**
 * Get or create a conversation between two users
 * @param {string} userId - The current user's ID
 * @param {string} otherUserId - The other user's ID
 * @param {string} vehicleId - Optional vehicle ID if conversation is about a specific vehicle
 * @returns {Object} The conversation object
 */
export const getOrCreateConversation = async (userId, otherUserId, vehicleId = null) => {
  try {
    // Check if conversation already exists
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId)
    );
    
    const snapshot = await getDocs(q);
    
    const existingConversations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    const conversation = existingConversations.find(conv => 
      conv.participants.includes(otherUserId) && 
      (vehicleId ? conv.vehicleId === vehicleId : !conv.vehicleId)
    );

    if (conversation) {
      return conversation;
    }

    // Create new conversation
    const newConversation = {
      participants: [userId, otherUserId],
      messages: [],
      lastMessage: null,
      lastMessageTimestamp: serverTimestamp(),
      vehicleId: vehicleId,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(conversationsRef, newConversation);
    
    return {
      id: docRef.id,
      ...newConversation,
      lastMessageTimestamp: new Date(), // Convert serverTimestamp to Date for immediate use
      createdAt: new Date(), // Convert serverTimestamp to Date for immediate use
    };
  } catch (error) {
    console.error('Error getting or creating conversation:', error);
    throw error;
  }
};

/**
 * Upload an image to Firebase Storage
 * @param {string} uri - The local URI of the image
 * @param {string} conversationId - The conversation ID
 * @returns {string} The download URL of the uploaded image
 */
export const uploadChatImage = async (uri, conversationId) => {
  try {
    // Create a unique filename
    const filename = `chats/${conversationId}/${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);
    
    // Fetch the image data
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Upload to Firebase Storage
    await uploadBytes(storageRef, blob);
    
    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Send a message in a conversation
 * @param {string} conversationId - The conversation ID
 * @param {string} senderId - The sender's user ID
 * @param {string} content - The message text content
 * @param {string} imageUri - Optional image URI to include with the message
 * @returns {Object} The sent message object
 */
export const sendMessage = async (conversationId, senderId, content, imageUri = null) => {
  try {
    let imageUrl = null;
    
    // If an image is included, upload it first
    if (imageUri) {
      imageUrl = await uploadChatImage(imageUri, conversationId);
    }
    
    const message = {
      id: Date.now().toString(), // Generate a client-side ID
      sender: senderId,
      content,
      imageUrl,
      timestamp: new Date(),
      read: false,
    };

    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);
    
    if (conversationSnap.exists()) {
      // Update the conversation with the new message
      await updateDoc(conversationRef, {
        messages: arrayUnion(message),
        lastMessage: {
          content: imageUrl ? (content || 'Sent an image') : content,
          sender: senderId,
          timestamp: new Date(),
          hasImage: !!imageUrl
        },
        lastMessageTimestamp: serverTimestamp(),
      });
    } else {
      console.error('Conversation not found');
      throw new Error('Conversation not found');
    }

    return message;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Mark all unread messages in a conversation as read
 * @param {string} conversationId - The conversation ID
 * @param {string} userId - The current user's ID (messages not from this user will be marked as read)
 */
export const markMessagesAsRead = async (conversationId, userId) => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);
    
    if (!conversationSnap.exists()) {
      return;
    }

    const { messages } = conversationSnap.data();
    const updatedMessages = messages.map(msg => {
      if (msg.sender !== userId && !msg.read) {
        return { ...msg, read: true };
      }
      return msg;
    });

    await updateDoc(conversationRef, { messages: updatedMessages });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

/**
 * Subscribe to messages in a conversation for real-time updates
 * @param {string} conversationId - The conversation ID
 * @param {Function} callback - Callback function that receives the updated messages array
 * @returns {Function} Unsubscribe function to stop listening for updates
 */
export const subscribeToMessages = (conversationId, callback) => {
  const conversationRef = doc(db, 'conversations', conversationId);
  
  return onSnapshot(conversationRef, (docSnapshot) => {
    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      callback(data.messages || []);
    } else {
      callback([]);
    }
  }, error => {
    console.error('Error listening to messages:', error);
  });
};

/**
 * Get user data for all participants in a conversation
 * @param {Object} conversation - The conversation object
 * @returns {Object} Updated conversation with participant data
 */
export const getConversationWithUserData = async (conversation) => {
  try {
    // In a real app, you would fetch user data from your backend API
    // This is a placeholder implementation
    const participantData = {};
    
    // For each participant ID, fetch user data
    for (const participantId of conversation.participants) {
      // Replace with your actual user data fetching logic
      const userData = await AsyncStorage.getItem(`userData-${participantId}`);
      if (userData) {
        const parsedUserData = JSON.parse(userData);
        participantData[participantId] = {
          name: parsedUserData.name,
          avatar: parsedUserData.profileImage || null,
        };
      } else {
        // Fallback when user data is not available
        participantData[participantId] = {
          name: 'User',
          avatar: null,
        };
      }
    }
    
    return {
      ...conversation,
      participantData,
    };
  } catch (error) {
    console.error('Error enriching conversation data:', error);
    return conversation;
  }
};

/**
 * Delete a message from a conversation
 * @param {string} conversationId - The conversation ID
 * @param {string} messageId - The message ID to delete
 */
export const deleteMessage = async (conversationId, messageId) => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);
    
    if (!conversationSnap.exists()) {
      return;
    }

    const { messages } = conversationSnap.data();
    const updatedMessages = messages.filter(msg => msg.id !== messageId);

    await updateDoc(conversationRef, { messages: updatedMessages });
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};