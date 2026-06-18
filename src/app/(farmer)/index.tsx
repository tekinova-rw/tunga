// src/app/(farmer)/animals/index.tsx
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAnimals } from '@/hooks/useAnimals';
import { Animal } from '@/services/animal-service';

export default function AnimalsScreen() {
  const {
    data,
    isLoading,
    error,
  } = useAnimals();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading animals...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="sad-outline" size={60} color="#ccc" />
        <Text style={styles.errorText}>Failed to load animals</Text>
        <Text style={styles.errorSubtext}>{error.message}</Text>
      </View>
    );
  }

  // Ensure data is an array (handle undefined/null)
  const animals: Animal[] = Array.isArray(data) ? data : [];

  if (animals.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="paw-outline" size={60} color="#ccc" />
        <Text style={styles.emptyText}>No animals yet</Text>
        <Text style={styles.emptySubtext}>Tap the + button to add your first animal</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={animals}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push({
            pathname: '/(farmer)/animals/[id]',
            params: { id: item.id }
          } as any)}
          activeOpacity={0.7}
        >
          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <Text style={styles.animalIcon}>
                {item.category === 'Cow' ? '🐄' : 
                 item.category === 'Goat' ? '🐐' : 
                 item.category === 'Sheep' ? '🐑' : 
                 item.category === 'Pig' ? '🐷' : 
                 item.category === 'Chicken' ? '🐔' : '🐾'}
              </Text>
            </View>
            <View style={styles.infoContainer}>
              <Text style={styles.animalName}>{item.name}</Text>
              <Text style={styles.animalDetails}>
                {item.category} • {item.age} {item.age === 1 ? 'year' : 'years'} • {item.weight}kg
              </Text>
              <View style={styles.healthContainer}>
                <View style={[styles.healthDot, { 
                  backgroundColor: 
                    item.health_status === 'healthy' ? '#4CAF50' :
                    item.health_status === 'sick' ? '#f44336' :
                    item.health_status === 'recovering' ? '#FF9800' : '#999'
                }]} />
                <Text style={styles.healthText}>
                  {item.health_status?.toUpperCase() || 'UNKNOWN'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </View>
        </TouchableOpacity>
      )}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
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
  listContent: {
    padding: 16,
    backgroundColor: '#f5f5f5',
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