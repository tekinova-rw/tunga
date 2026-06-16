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
  health_status?: string;
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
      const response = await api.get('/farmer/animals');
      
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
          { id: '1', name: 'Bella', category: 'Cow' },
          { id: '2', name: 'Molly', category: 'Goat' },
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
              await api.delete(`/farmer/animals/${id}`);
              setAnimals(prev => prev.filter(a => a.id !== id));
              Alert.alert('Success', 'Animal deleted');
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/(farmer)/animals/add')}
      >
        <Text style={styles.addText}>+ Add Animal</Text>
      </TouchableOpacity>

      <FlatList
        data={animals}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2E7D32']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No animals yet</Text>
            <Text style={styles.emptySubtext}>Tap "Add Animal" to get started</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(farmer)/animals/${item.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.cardRow}>
              <View style={styles.cardInfo}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.category}>{item.category}</Text>
                {item.breed && <Text style={styles.breed}>{item.breed}</Text>}
              </View>
              <TouchableOpacity
                onPress={() => handleDelete(item.id, item.name)}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={22} color="#ff4444" />
              </TouchableOpacity>
            </View>
            {item.health_status && (
              <View style={[
                styles.healthBadge,
                item.health_status === 'healthy' && styles.healthHealthy,
                item.health_status === 'sick' && styles.healthSick,
              ]}>
                <Text style={styles.healthText}>{item.health_status}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  addButton: {
    backgroundColor: '#2E7D32',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B5E20',
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    color: '#666',
  },
  breed: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  healthBadge: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  healthHealthy: {
    backgroundColor: '#E8F5E9',
  },
  healthSick: {
    backgroundColor: '#FFEBEE',
  },
  healthText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2E7D32',
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
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});