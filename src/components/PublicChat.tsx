// ============================================================
// FILE: src/components/PublicChat.tsx
// DESCRIPTION: Public chat component for all users
// ============================================================

import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/services/api';
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

export const PublicChat = () => {
  const [messages, setMessages] = useState<PublicMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { socket, isConnected } = useSocket();

  // Load messages
  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/public-chat/messages');
      setMessages(response.data.data || []);
    } catch (error) {
      console.error('Load messages error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const response = await api.post('/public-chat/messages', {
        message: newMessage.trim(),
      });

      // Add to local state
      if (response.data.data) {
        setMessages([response.data.data, ...messages]);
        setNewMessage('');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
      console.error('Send message error:', error);
    }
  };

  // Report message
  const reportMessage = async (messageId: number) => {
    Alert.prompt(
      'Report Message',
      'Why are you reporting this message?',
      async (reason) => {
        if (reason) {
          try {
            await api.post(`/public-chat/messages/${messageId}/report`, { reason });
            Alert.alert('Success', 'Message reported successfully');
          } catch (error) {
            Alert.alert('Error', 'Failed to report message');
          }
        }
      }
    );
  };

  // Listen for new messages via socket
  useEffect(() => {
    if (socket) {
      socket.on('public_message', (message: PublicMessage) => {
        setMessages(prev => [message, ...prev]);
      });
    }

    return () => {
      if (socket) {
        socket.off('public_message');
      }
    };
  }, [socket]);

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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💬 Public Chat</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? '#4CAF50' : '#f44336' }]} />
          <Text style={styles.statusText}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.messageItem}>
            <View style={styles.messageHeader}>
              <Text style={[styles.userName, { color: getRoleColor(item.user_role) }]}>
                {item.user_name}
              </Text>
              <Text style={styles.userRole}>
                {getRoleLabel(item.user_role)}
              </Text>
              <Text style={styles.messageTime}>
                {new Date(item.created_at).toLocaleTimeString()}
              </Text>
            </View>
            <Text style={styles.messageText}>{item.message}</Text>
            <TouchableOpacity
              style={styles.reportButton}
              onPress={() => reportMessage(item.id)}
            >
              <Ionicons name="flag-outline" size={16} color="#999" />
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={styles.messagesList}
        inverted
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!newMessage.trim()}
        >
          <Ionicons name="send" size={24} color="white" />
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
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
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
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});