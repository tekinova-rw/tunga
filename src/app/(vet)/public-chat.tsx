// ============================================================
// FILE: src/app/(vet)/public-chat.tsx
// DESCRIPTION: Public chat screen for veterinarians with real-time updates
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth-store';
import { useSocket } from '@/hooks/useSocket';

interface PublicMessage {
  id: number;
  user_id: number;
  message: string;
  image_url: string | null;
  created_at: string;
  user_name: string;
  user_role: string;
}

export default function VetPublicChatScreen() {
  const [messages, setMessages] = useState<PublicMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user, token } = useAuthStore();
  const { socket, isConnected, onPublicMessage, off } = useSocket();

  // Load messages
  const loadMessages = async (showLoading: boolean = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const response = await fetch('http://10.7.33.242:5000/api/public-chat/messages', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setMessages(data.data || []);
    } catch (error) {
      console.error('Load messages error:', error);
      if (showLoading) {
        Alert.alert('Error', 'Failed to load messages');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const response = await fetch('http://10.7.33.242:5000/api/public-chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: newMessage.trim() }),
      });
      const data = await response.json();

      if (data.success) {
        setMessages(prev => [data.data, ...prev]);
        setNewMessage('');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
      console.error('Send message error:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Report message
  const reportMessage = (messageId: number) => {
    Alert.prompt(
      'Report Message',
      'Why are you reporting this message?',
      async (reason) => {
        if (reason) {
          try {
            await fetch(`http://10.7.33.242:5000/api/public-chat/messages/${messageId}/report`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ reason }),
            });
            Alert.alert('Success', 'Message reported successfully');
          } catch (error) {
            Alert.alert('Error', 'Failed to report message');
          }
        }
      }
    );
  };

  // Refresh handler
  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadMessages(false);
  }, []);

  // Listen for new messages via socket
  useEffect(() => {
    if (socket && isConnected) {
      console.log('✅ Setting up socket listener for public messages (Vet)');
      
      const handlePublicMessage = (message: PublicMessage) => {
        console.log('📩 New public message received:', message);
        setMessages(prev => [message, ...prev]);
      };
      
      onPublicMessage(handlePublicMessage);

      return () => {
        console.log('🧹 Cleaning up socket listener');
        off('public_message', handlePublicMessage);
      };
    }
  }, [socket, isConnected, onPublicMessage, off]);

  // Load messages on mount
  useEffect(() => {
    loadMessages();
  }, []);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return '#D32F2F';
      case 'district_admin': return '#FF9800';
      case 'veterinarian': return '#7B1FA2';
      case 'farmer': return '#2E7D32';
      default: return '#666';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return '👑 Admin';
      case 'district_admin': return '📋 Admin';
      case 'veterinarian': return '🩺 Vet';
      case 'farmer': return '🌾 Farmer';
      default: return '👤 User';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#7B1FA2" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💬 Public Chat</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? '#4CAF50' : '#f44336' }]} />
          <Text style={styles.statusText}>{isConnected ? 'Online' : 'Offline'}</Text>
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[
            styles.messageItem,
            item.user_id === user?.id && styles.myMessage
          ]}>
            <View style={styles.messageHeader}>
              <Text style={[styles.userName, { color: getRoleColor(item.user_role) }]}>
                {item.user_name}
              </Text>
              <Text style={styles.userRole}>{getRoleLabel(item.user_role)}</Text>
              <Text style={styles.messageTime}>
                {new Date(item.created_at).toLocaleTimeString()}
              </Text>
            </View>
            <Text style={styles.messageText}>{item.message}</Text>
            {item.user_id !== user?.id && (
              <TouchableOpacity
                style={styles.reportButton}
                onPress={() => reportMessage(item.id)}
              >
                <Ionicons name="flag-outline" size={16} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        )}
        contentContainerStyle={styles.messagesList}
        inverted
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#7B1FA2']}
          />
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          editable={!isSending}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!newMessage.trim() || isSending) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="send" size={24} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A148C',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  messagesList: {
    padding: 16,
  },
  messageItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  myMessage: {
    backgroundColor: '#F3E5F5',
    borderWidth: 1,
    borderColor: '#CE93D8',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  userRole: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
    marginLeft: 'auto',
  },
  messageText: {
    fontSize: 15,
    color: '#333',
  },
  reportButton: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7B1FA2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});