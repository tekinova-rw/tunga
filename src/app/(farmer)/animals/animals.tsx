// src/app/(farmer)/animals/animals.tsx
import { useFocusEffect, router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { api } from '../../../api/axios';
import { useAuthStore } from '../../../store/auth-store';

type Animal = {
  id: string;
  name: string;
  category: string;
  breed?: string;
  age?: number;
  weight?: number;
  health_status?: string;
  created_at?: string;
};

export default function AnimalsScreen() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { token } = useAuthStore();

  const fetchAnimals = async () => {
    try {
      if (!token) {
        console.log('No token found');
        return;
      }

      console.log('Fetching animals...');
      // ✅ FIX: Use /animals instead of /farmer/animals
      const response = await api.get('/animals');
      
      console.log('Animals response:', response.data);
      
      // Handle different response formats
      const animalsData = Array.isArray(response.data) 
        ? response.data 
        : response.data?.data || [];
      
      setAnimals(animalsData);
    } catch (error: any) {
      console.log('Fetch error:', error?.response?.data || error.message);
      
      if (error?.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again');
        router.replace('/(auth)/login');
      } else if (error?.response?.status === 404) {
        // Endpoint not found yet - use mock data for now
        console.log('API endpoint not ready, using mock data');
        setAnimals([
          { id: '1', name: 'Bella', category: 'Cow', breed: 'Friesian', health_status: 'healthy' },
          { id: '2', name: 'Molly', category: 'Goat', breed: 'Saanen', health_status: 'healthy' },
          { id: '3', name: 'Max', category: 'Cow', breed: 'Holstein', health_status: 'sick' },
        ]);
      } else {
        Alert.alert('Error', 'Failed to load animals');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAnimals();
    }, [token])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnimals();
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Animal',
      `Delete ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // ✅ FIX: Use /animals instead of /farmer/animals
              await api.delete(`/animals/${id}`);
              setAnimals(prev => prev.filter(a => a.id !== id));
              Alert.alert('Success', 'Animal deleted successfully');
            } catch (error: any) {
              console.log('Delete error:', error?.response?.data);
              Alert.alert('Error', error?.response?.data?.message || 'Failed to delete animal');
            }
          },
        },
      ]
    );
  };

  const getHealthStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy': return '#4CAF50';
      case 'sick': return '#f44336';
      case 'recovering': return '#FF9800';
      case 'under treatment': return '#2196F3';
      case 'pregnant': return '#9C27B0';
      case 'critical': return '#D32F2F';
      default: return '#999';
    }
  };

  const getHealthStatusLabel = (status: string) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'cow': return '🐄';
      case 'goat': return '🐐';
      case 'sheep': return '🐑';
      case 'pig': return '🐷';
      case 'chicken': return '🐔';
      case 'rabbit': return '🐰';
      case 'horse': return '🐴';
      default: return '🐾';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading animals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/(farmer)/animals/add')}
      >
        <Ionicons name="add-circle-outline" size={24} color="#fff" />
        <Text style={styles.addText}>Add Animal</Text>
      </TouchableOpacity>

      <FlatList
        data={animals}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2E7D32']}
            tintColor="#2E7D32"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="paw-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No animals yet</Text>
            <Text style={styles.emptySubtext}>Tap "Add Animal" to get started</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push({
              pathname: '/(farmer)/animals/[id]',
              params: { id: item.id }
            } as any)}
            activeOpacity={0.7}
          >
            <View style={styles.cardRow}>
              <View style={styles.cardIconContainer}>
                <Text style={styles.cardIcon}>{getCategoryIcon(item.category)}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.category}>{item.category}</Text>
                {item.breed && <Text style={styles.breed}>{item.breed}</Text>}
                {item.age !== undefined && (
                  <Text style={styles.age}>
                    {item.age} {item.age === 1 ? 'year' : 'years'} old
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => handleDelete(item.id, item.name)}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={22} color="#ff4444" />
              </TouchableOpacity>
            </View>
            {item.health_status && (
              <View style={styles.healthContainer}>
                <View style={[
                  styles.healthDot,
                  { backgroundColor: getHealthStatusColor(item.health_status) }
                ]} />
                <Text style={[
                  styles.healthText,
                  { color: getHealthStatusColor(item.health_status) }
                ]}>
                  {getHealthStatusLabel(item.health_status)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
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
  addButton: {
    backgroundColor: '#2E7D32',
    padding: 15,
    borderRadius: 12,
    margin: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B5E20',
    marginBottom: 2,
  },
  category: {
    fontSize: 14,
    color: '#666',
    marginBottom: 1,
  },
  breed: {
    fontSize: 12,
    color: '#999',
  },
  age: {
    fontSize: 12,
    color: '#999',
    marginTop: 1,
  },
  deleteButton: {
    padding: 8,
  },
  healthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 6,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  healthText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
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
  },
});