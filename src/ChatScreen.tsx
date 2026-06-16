// src/screens/ChatScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Keyboard,
  StyleSheet,
} from 'react-native';
import { io, Socket } from 'socket.io-client';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '@/store/auth-store';
import { api, getCurrentApiUrl } from '@/services/api';

interface Message {
  id: string;
  conversation_id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  created_at: string;
  status?: 'sent' | 'delivered' | 'read';
  is_read?: boolean;
}

interface TypingIndicator {
  user_id: number;
  is_typing: boolean;
}

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    conversationId?: string;
    receiverId?: string;
    receiverName?: string;
  }>();
  
  const { user, token } = useAuthStore();
  
  const conversationId = params.conversationId ? parseInt(params.conversationId) : undefined;
  const receiverId = params.receiverId ? parseInt(params.receiverId) : undefined;
  const receiverName = params.receiverName || 'User';
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const BACKEND_URL = getCurrentApiUrl().replace('/api', '');

  // Load messages from API
  useEffect(() => {
    const loadMessages = async () => {
      if (!conversationId) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await api.get(`/chat/messages/${conversationId}`);
        
        if (response.data && Array.isArray(response.data)) {
          setMessages(response.data);
        }
      } catch (err: any) {
        console.log('Load messages error:', err.response?.data || err.message);
        if (err.response?.status !== 404) {
          setError('Failed to load messages');
        }
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [conversationId]);

  // Initialize socket connection
  useEffect(() => {
    if (!conversationId || !user?.id || !token || error) {
      return;
    }

    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Socket connected');
      setIsConnected(true);
      setError(null);
      
      // Join conversation room
      socket.emit('join_room', conversationId);
    });

    socket.on('connect_error', (err) => {
      console.log('❌ Socket error:', err.message);
      setIsConnected(false);
    });

    socket.on('disconnect', () => {
      console.log('⚠️ Socket disconnected');
      setIsConnected(false);
    });

    // Receive new message
    socket.on('receive_message', (msg: Message) => {
      console.log('📨 New message:', msg);
      
      // Mark as read if it's from the other user
      if (msg.sender_id === receiverId && socketRef.current) {
        socketRef.current.emit('mark_read', { messageId: msg.id, conversationId });
      }
      
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        const newMessages = [...prev, msg];
        setTimeout(() => scrollToBottom(), 100);
        return newMessages;
      });
    });

    // Receive typing indicator
    socket.on('typing_indicator', (data: TypingIndicator) => {
      if (data.user_id === receiverId) {
        setIsTyping(data.is_typing);
      }
    });

    // Message status updates
    socket.on('message_delivered', ({ messageId }: { messageId: string }) => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, status: 'delivered' } : msg
        )
      );
    });

    socket.on('message_read', ({ messageId }: { messageId: string }) => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, status: 'read' } : msg
        )
      );
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [conversationId, user?.id, token, receiverId, error, BACKEND_URL]);

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const sendMessage = async () => {
    if (!socketRef.current || !isConnected) {
      Alert.alert('Not Connected', 'Please wait for connection to be established');
      return;
    }
    
    if (!text.trim()) return;
    
    setSending(true);
    Keyboard.dismiss();
    
    const messageText = text.trim();
    setText('');
    
    // Optimistic message
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId!,
      sender_id: user!.id,
      receiver_id: receiverId!,
      message: messageText,
      created_at: new Date().toISOString(),
      status: 'sent',
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    scrollToBottom();
    
    try {
      socketRef.current.emit('send_message', {
        conversationId,
        receiverId,
        message: messageText,
      });
    } catch (error) {
      console.log('Send error:', error);
      Alert.alert('Error', 'Failed to send message');
      // Update message status to failed
      setMessages(prev => 
        prev.map(msg => 
          msg.id === optimisticMessage.id 
            ? { ...msg, status: 'sent' } 
            : msg
        )
      );
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (value: string) => {
    setText(value);
    
    if (!socketRef.current || !isConnected) return;
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    socketRef.current.emit('typing', {
      conversationId,
      receiverId,
      isTyping: true,
    });
    
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing', {
        conversationId,
        receiverId,
        isTyping: false,
      });
    }, 1000);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === user?.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isMe ? styles.myMessage : styles.theirMessage
      ]}>
        <Text style={styles.messageText}>{item.message}</Text>
        <View style={styles.messageFooter}>
          <Text style={styles.messageTime}>
            {formatTime(item.created_at)}
          </Text>
          {isMe && item.status === 'read' && (
            <Ionicons name="checkmark-done" size={14} color="#34B7F1" />
          )}
          {isMe && item.status === 'delivered' && (
            <Ionicons name="checkmark-done" size={14} color="#999" />
          )}
          {isMe && item.status === 'sent' && (
            <Ionicons name="checkmark" size={14} color="#999" />
          )}
        </View>
      </View>
    );
  };

  if (error) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#f44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Connection Status */}
        <View style={[
          styles.statusBar,
          { backgroundColor: isConnected ? '#4CAF50' : '#FF9800' }
        ]}>
          <Text style={styles.statusText}>
            {isConnected ? '● Connected' : '○ Connecting...'}
          </Text>
        </View>

        {/* Typing Indicator */}
        {isTyping && (
          <View style={styles.typingContainer}>
            <Text style={styles.typingText}>{receiverName} is typing...</Text>
          </View>
        )}

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => item.id || index.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>
                Send a message to start the conversation
              </Text>
            </View>
          }
        />

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            value={text}
            onChangeText={handleTyping}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            style={styles.input}
            multiline
            maxLength={500}
            editable={!sending}
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!text.trim() || !isConnected || sending}
            style={[
              styles.sendButton,
              (!text.trim() || !isConnected || sending) && styles.sendButtonDisabled
            ]}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  flex: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    marginTop: 12,
    textAlign: 'center',
  },
  statusBar: {
    paddingVertical: 4,
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  typingText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  messagesList: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    marginVertical: 4,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  messageTime: {
    fontSize: 10,
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'flex-end',
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#F9F9F9',
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#2E7D32',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 20,
    backgroundColor: '#2E7D32',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});