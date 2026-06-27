// ============================================================
// FILE: src/app/(farmer)/animals/index.tsx
// DESCRIPTION: Animals list screen for farmers
// ============================================================

import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

import { useAnimals } from '@/hooks/useAnimals';

// Define Animal type matching the backend
interface Animal {
  id: number | string; // Allow both number and string
  name: string;
  category: string;
  age: number;
  weight: number;
  health_status: string;
  breed?: string;
  gender?: string;
  created_at?: string;
  updated_at?: string;
}

export default function AnimalsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useAnimals();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading animals...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    console.log('❌ Animals fetch error:', error);
    return (
      <View style={styles.centered}>
        <Ionicons name="sad-outline" size={60} color="#ccc" />
        <Text style={styles.errorText}>Failed to load animals</Text>
        <Text style={styles.errorSubtext}>
          {error.message || 'Please check your connection and try again'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Ensure data is an array (handle undefined/null)
  const animals: Animal[] = Array.isArray(data) ? data : [];

  // Empty state
  if (animals.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="paw-outline" size={60} color="#ccc" />
        <Text style={styles.emptyText}>No animals yet</Text>
        <Text style={styles.emptySubtext}>
          Tap the + button to add your first animal
        </Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/(farmer)/animals/add' as any)}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Animal</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Get emoji for animal category
  const getAnimalEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      cow: '🐄',
      cattle: '🐄',
      goat: '🐐',
      sheep: '🐑',
      pig: '🐷',
      chicken: '🐔',
      rabbit: '🐰',
      horse: '🐴',
      dog: '🐕',
      cat: '🐱',
      duck: '🦆',
      turkey: '🦃',
      fish: '🐟',
      other: '🐾',
    };
    return emojis[category?.toLowerCase()] || '🐾';
  };

  // Get health status color
  const getHealthColor = (status: string) => {
    const colors: Record<string, string> = {
      healthy: '#4CAF50',
      good: '#4CAF50',
      sick: '#f44336',
      recovering: '#FF9800',
      under_treatment: '#2196F3',
      treatment: '#2196F3',
      critical: '#D32F2F',
      deceased: '#757575',
      quarantined: '#9C27B0',
      unknown: '#999',
    };
    return colors[status?.toLowerCase()] || '#999';
  };

  // Render individual animal card
  const renderAnimalCard = ({ item }: { item: Animal }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({
        pathname: '/(farmer)/animals/[id]',
        params: { id: item.id.toString() }
      } as any)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <Text style={styles.animalIcon}>
            {getAnimalEmoji(item.category)}
          </Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.animalName}>{item.name || 'Unnamed'}</Text>
          <Text style={styles.animalDetails}>
            {item.category || 'Unknown'} • {item.age || 0} {item.age === 1 ? 'year' : 'years'} • {item.weight || 0}kg
          </Text>
          <View style={styles.healthContainer}>
            <View style={[styles.healthDot, { 
              backgroundColor: getHealthColor(item.health_status)
            }]} />
            <Text style={styles.healthText}>
              {(item.health_status?.toUpperCase() || 'UNKNOWN')}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={animals}
      keyExtractor={(item) => String(item.id || Math.random())}
      renderItem={renderAnimalCard}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#2E7D32']}
          tintColor="#2E7D32"
        />
      }
      ListHeaderComponent={
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>My Animals</Text>
          <Text style={styles.headerSubtitle}>
            {animals.length} {animals.length === 1 ? 'animal' : 'animals'} registered
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  centered: {
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
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#2E7D32',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  addButton: {
    marginTop: 20,
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  animalIcon: {
    fontSize: 28,
  },
  infoContainer: {
    flex: 1,
  },
  animalName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B5E20',
    marginBottom: 4,
  },
  animalDetails: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  healthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  healthText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
});