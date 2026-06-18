// src/app/(farmer)/messages.tsx
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MessagesScreen() {
  const conversations = [
    {
      id: '1',
      name: 'Dr. Jean Paul',
      clinic: 'Inka Veterinary Clinic',
      lastMessage: 'Your appointment is confirmed for tomorrow',
      time: '10:30 AM',
      unread: true,
    },
    {
      id: '2',
      name: 'Dr. Marie Claire',
      clinic: 'Kigali Vet Center',
      lastMessage: 'Please send me the animal health records',
      time: 'Yesterday',
      unread: false,
    },
    {
      id: '3',
      name: 'Dr. Peter Mugabo',
      clinic: 'Rwanda Veterinary Services',
      lastMessage: 'Vaccination schedule updated',
      time: '2 days ago',
      unread: false,
    },
  ];

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.conversationItem}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
            </View>
            <View style={styles.conversationContent}>
              <View style={styles.conversationHeader}>
                <Text style={styles.conversationName}>{item.name}</Text>
                <Text style={styles.conversationTime}>{item.time}</Text>
              </View>
              <Text style={styles.clinicName}>{item.clinic}</Text>
              <Text style={styles.lastMessage}>{item.lastMessage}</Text>
            </View>
            {item.unread && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
  },
  conversationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
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
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2E7D32',
    marginLeft: 8,
  },
});