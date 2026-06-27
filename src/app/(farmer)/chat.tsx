// ============================================================
// FILE: src/app/(farmer)/chat.tsx
// DESCRIPTION: Chat hub - combines all chat features
// ============================================================

import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import { api } from '../../api/axios';
import { useAuthStore } from '../../store/auth-store';

type Conversation = {
  id: string;
  farmer_id: number;
  veterinarian_id: number;
  veterinarian_name: string;
  veterinarian_phone: string;
  clinic_name?: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  created_at: string;
};

type ChatOption = {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  badge?: number;
  color: string;
};

export default function ChatHubScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, token, logout } = useAuthStore();

  // Chat options for the hub
  const chatOptions: ChatOption[] = [
    {
      id: 'messages',
      title: 'Private Messages',
      description: 'Chat with veterinarians and admins',
      icon: 'chatbubble-outline',
      route: '/(farmer)/messages',
      badge: conversations.reduce((sum, c) => sum + c.unread_count, 0),
      color: '#2E7D32',
    },
    {
      id: 'public',
      title: 'Public Chat',
      description: 'Join group discussions with other farmers',
      icon: 'people-outline',
      route: '/(farmer)/public-chat',
      badge: 0,
      color: '#2196F3',
    },
    {
      id: 'ai',
      title: 'AI Assistant',
      description: 'Get instant help from our AI assistant',
      icon: 'bulb-outline',
      route: '/(farmer)/ai-chat',
      badge: 0,
      color: '#FF9800',
    },
  ];

  const loadConversations = async () => {
    try {
      if (!token || !user) {
        router.replace('/(auth)/login');
        return;
      }

      const response = await api.get('/farmer/conversations');
      const data = response.data.data || response.data;
      
      const convos = Array.isArray(data) ? data : [];
      setConversations(convos);
      
    } catch (error: any) {
      console.log('Load conversations error:', error?.response?.data || error.message);
      
      if (error?.response?.status === 401) {
        await logout();
        Alert.alert('Session Expired', 'Please login again.');
        router.replace('/(auth)/login');
        return;
      }
      
      // Mock data if API fails
      setConversations([
        {
          id: '1',
          farmer_id: user?.id || 1,
          veterinarian_id: 8,
          veterinarian_name: 'Dr. Ogi',
          veterinarian_phone: '0780000008',
          clinic_name: 'Inka Veterinary Clinic',
          last_message: 'Your appointment is confirmed for tomorrow',
          last_message_at: new Date().toISOString(),
          unread_count: 2,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          farmer_id: user?.id || 1,
          veterinarian_id: 10,
          veterinarian_name: 'Dr. Wellaris',
          veterinarian_phone: '0780000010',
          clinic_name: 'Kigali Vet Center',
          last_message: 'Please send me the animal health records',
          last_message_at: new Date(Date.now() - 86400000).toISOString(),
          unread_count: 0,
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleConversationPress = (conversation: Conversation) => {
    router.push({
      pathname: '/(farmer)/chat-detail',
      params: {
        conversationId: conversation.id,
        veterinarianId: conversation.veterinarian_id,
        veterinarianName: conversation.veterinarian_name,
        clinicName: conversation.clinic_name || 'Veterinarian',
      },
    } as any);
  };

  const navigateToChat = (route: string) => {
    router.push(route as any);
  };

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [token])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    if (diff < 172800000) return 'Yesterday';
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;
    return date.toLocaleDateString();
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading chat options...</Text>
      </View>
    );
  }

  // Render the chat hub cards
  const renderChatCard = ({ item }: { item: ChatOption }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigateToChat(item.route)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
        <Ionicons name={item.icon} size={28} color={item.color} />
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          {item.badge && item.badge > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.badge}</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardDescription}>{item.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  // Render conversation item
  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => handleConversationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.veterinarian_name.charAt(0)}
        </Text>
      </View>
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName}>
            {item.veterinarian_name}
          </Text>
          <Text style={styles.conversationTime}>
            {formatTime(item.last_message_at)}
          </Text>
        </View>
        {item.clinic_name && (
          <Text style={styles.clinicName}>{item.clinic_name}</Text>
        )}
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.last_message}
        </Text>
      </View>
      {item.unread_count > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>
            {item.unread_count > 99 ? '99+' : item.unread_count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#2E7D32']}
          tintColor="#2E7D32"
        />
      }
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Chat</Text>
          <Text style={styles.subtitle}>Connect with veterinarians and farmers</Text>
        </View>

        {/* Chat Options Cards */}
        <Text style={styles.sectionTitle}>Chat Options</Text>
        {chatOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.card}
            onPress={() => navigateToChat(option.route)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: option.color + '15' }]}>
              <Ionicons name={option.icon} size={28} color={option.color} />
            </View>
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{option.title}</Text>
                {option.badge && option.badge > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{option.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardDescription}>{option.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        ))}

        {/* Private Messages Section */}
        <View style={styles.messagesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Conversations</Text>
            <TouchableOpacity 
              onPress={() => navigateToChat('/(farmer)/messages')}
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {conversations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={40} color="#ccc" />
              <Text style={styles.emptyText}>No conversations yet</Text>
              <Text style={styles.emptySubtext}>
                Start a conversation with a veterinarian
              </Text>
            </View>
          ) : (
            conversations.slice(0, 3).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.conversationItem}
                onPress={() => handleConversationPress(item)}
                activeOpacity={0.7}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.veterinarian_name.charAt(0)}
                  </Text>
                </View>
                <View style={styles.conversationContent}>
                  <View style={styles.conversationHeader}>
                    <Text style={styles.conversationName}>
                      {item.veterinarian_name}
                    </Text>
                    <Text style={styles.conversationTime}>
                      {formatTime(item.last_message_at)}
                    </Text>
                  </View>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {item.last_message}
                  </Text>
                </View>
                {item.unread_count > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>
                      {item.unread_count > 99 ? '99+' : item.unread_count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Tip Section */}
        <View style={styles.tipContainer}>
          <Ionicons name="information-circle-outline" size={24} color="#2E7D32" />
          <Text style={styles.tipText}>
            💡 Tip: Use AI Assistant for quick answers about animal health
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cardDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#D32F2F',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  messagesSection: {
    marginTop: 8,
  },
  conversationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  conversationTime: {
    fontSize: 12,
    color: '#999',
  },
  clinicName: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  unreadBadge: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  tipContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#2E7D32',
    lineHeight: 20,
  },
});