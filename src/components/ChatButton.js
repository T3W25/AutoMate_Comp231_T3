import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { initiateChat } from '../services/chatService';

/**
 * Reusable chat button component to initiate chats from anywhere in the app
 * 
 * @param {Object} props - Component props
 * @param {string} props.userId - ID of the user to chat with
 * @param {string} props.userName - Name of the user to chat with
 * @param {string} props.userRole - Role of the user (mechanic, carOwner, renter)
 * @param {string} props.vehicleId - Optional vehicle ID for vehicle-related chats
 * @param {string} props.style - Custom style for the button
 * @param {string} props.size - Size of the button ('small', 'medium', 'large')
 * @param {boolean} props.iconOnly - Whether to show only the icon (no text)
 * @param {string} props.buttonType - Visual style ('primary', 'outlined', 'text')
 */
const ChatButton = ({ 
  userId, 
  userName, 
  userRole,
  vehicleId = null,
  style = {},
  size = 'medium',
  iconOnly = false,
  buttonType = 'primary'
}) => {
  const [loading, setLoading] = React.useState(false);
  const navigation = useNavigation();

  const handlePress = async () => {
    try {
      setLoading(true);
      
      // Validate required props
      if (!userId) {
        console.error('ChatButton error: userId is required');
        Alert.alert('Error', 'Cannot start conversation: Missing user information');
        setLoading(false);
        return;
      }
      
      // Call the initiate chat function from chatService
      const success = await initiateChat(
        navigation, 
        userId, 
        userName || 'User', 
        userRole || 'unknown',
        vehicleId
      );
      
      if (!success) {
        console.log('Chat initiation failed');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      Alert.alert('Error', 'Failed to start conversation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Determine styles based on size
  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return {
          button: styles.buttonSmall,
          text: styles.textSmall,
          icon: 16
        };
      case 'large':
        return {
          button: styles.buttonLarge,
          text: styles.textLarge,
          icon: 24
        };
      default: // medium
        return {
          button: styles.buttonMedium,
          text: styles.textMedium,
          icon: 20
        };
    }
  };

  // Determine styles based on button type
  const getButtonType = () => {
    switch (buttonType) {
      case 'outlined':
        return styles.buttonOutlined;
      case 'text':
        return styles.buttonText;
      default: // primary
        return styles.buttonPrimary;
    }
  };

  const buttonSize = getButtonSize();
  const buttonTypeStyle = getButtonType();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        buttonSize.button,
        buttonTypeStyle,
        style
      ]}
      onPress={handlePress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={buttonType === 'primary' ? 'white' : '#3498db'} />
      ) : (
        <>
          <Ionicons 
            name="chatbubble" 
            size={buttonSize.icon} 
            color={buttonType === 'primary' ? 'white' : '#3498db'} 
          />
          {!iconOnly && (
            <Text 
              style={[
                styles.text, 
                buttonSize.text,
                buttonType === 'primary' ? styles.textPrimary : styles.textSecondary
              ]}
            >
              Message
            </Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
  },
  buttonPrimary: {
    backgroundColor: '#3498db',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  buttonOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3498db',
  },
  buttonText: {
    backgroundColor: 'transparent',
  },
  buttonSmall: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  buttonMedium: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  buttonLarge: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  text: {
    marginLeft: 6,
    fontWeight: 'bold',
  },
  textPrimary: {
    color: 'white',
  },
  textSecondary: {
    color: '#3498db',
  },
  textSmall: {
    fontSize: 12,
  },
  textMedium: {
    fontSize: 14,
  },
  textLarge: {
    fontSize: 16,
  },
});

export default ChatButton;