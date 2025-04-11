import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

const NotificationSystemScreen = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [targetRole, setTargetRole] = useState('all');
  const [sendEmail, setSendEmail] = useState(true);
  const [sendPush, setSendPush] = useState(true);

  const handleSubmit = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Error', 'Title and message are required');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/admin/notifications', {
        title,
        message,
        targetRole,
        channels: {
          email: sendEmail,
          push: sendPush,
        },
      });
      
      Alert.alert(
        'Success',
        `Notification sent to ${response.data.targetUsers.length} users`
      );
      
      // Reset form
      setTitle('');
      setMessage('');
    } catch (error) {
      console.error('Error sending notification:', error);
      Alert.alert('Error', 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notification System</Text>
        <Text style={styles.headerSubtitle}>Send system-wide notifications</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Create Notification</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter notification title"
              value={title}
              onChangeText={setTitle}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Message</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter notification message"
              value={message}
              onChangeText={setMessage}
              multiline
              textAlignVertical="top"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Target Audience</Text>
            <View style={styles.roleSelector}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  targetRole === 'all' && styles.selectedRole,
                ]}
                onPress={() => setTargetRole('all')}
              >
                <Text
                  style={[
                    styles.roleButtonText,
                    targetRole === 'all' && styles.selectedRoleText,
                  ]}
                >
                  All Users
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  targetRole === 'renter' && styles.selectedRole,
                ]}
                onPress={() => setTargetRole('renter')}
              >
                <Text
                  style={[
                    styles.roleButtonText,
                    targetRole === 'renter' && styles.selectedRoleText,
                  ]}
                >
                  Renters
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  targetRole === 'carOwner' && styles.selectedRole,
                ]}
                onPress={() => setTargetRole('carOwner')}
              >
                <Text
                  style={[
                    styles.roleButtonText,
                    targetRole === 'carOwner' && styles.selectedRoleText,
                  ]}
                >
                  Car Owners
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  targetRole === 'mechanic' && styles.selectedRole,
                ]}
                onPress={() => setTargetRole('mechanic')}
              >
                <Text
                  style={[
                    styles.roleButtonText,
                    targetRole === 'mechanic' && styles.selectedRoleText,
                  ]}
                >
                  Mechanics
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notification Channels</Text>
            <View style={styles.switchContainer}>
              <View style={styles.switchItem}>
                <Text style={styles.switchLabel}>Email Notification</Text>
                <Switch
                  value={sendEmail}
                  onValueChange={setSendEmail}
                  trackColor={{ false: '#bdc3c7', true: '#d6a9e1' }}
                  thumbColor={sendEmail ? '#8e44ad' : '#f4f3f4'}
                />
              </View>
              
              <View style={styles.switchItem}>
                <Text style={styles.switchLabel}>Push Notification</Text>
                <Switch
                  value={sendPush}
                  onValueChange={setSendPush}
                  trackColor={{ false: '#bdc3c7', true: '#d6a9e1' }}
                  thumbColor={sendPush ? '#8e44ad' : '#f4f3f4'}
                />
              </View>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
                <>
                <Ionicons name="notifications" size={20} color="white" />
                <Text style={styles.submitButtonText}>Send Notification</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.recentNotificationsContainer}>
          <Text style={styles.sectionTitle}>Recent Notifications</Text>
          <View style={styles.emptyNotifications}>
            <Ionicons name="notifications-off" size={40} color="#bdc3c7" />
            <Text style={styles.emptyNotificationsText}>No recent notifications</Text>
          </View>
        </View>
      </ScrollView>
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
    backgroundColor: '#8e44ad',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e1bee7',
    marginTop: 5,
  },
  content: {
    padding: 15,
  },
  formContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2c3e50',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  roleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  roleButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    width: '48%',
    alignItems: 'center',
  },
  selectedRole: {
    backgroundColor: '#8e44ad',
  },
  roleButtonText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: 'bold',
  },
  selectedRoleText: {
    color: 'white',
  },
  switchContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
  },
  switchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  switchLabel: {
    fontSize: 16,
    color: '#2c3e50',
  },
  submitButton: {
    backgroundColor: '#8e44ad',
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  recentNotificationsContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyNotifications: {
    alignItems: 'center',
    padding: 20,
  },
  emptyNotificationsText: {
    marginTop: 10,
    color: '#7f8c8d',
    fontSize: 16,
  },
});

export default NotificationSystemScreen;