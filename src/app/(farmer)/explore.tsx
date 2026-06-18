// src/app/(farmer)/explore.tsx
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function ExploreScreen() {
  const features = [
    {
      id: '1',
      title: 'Veterinary Tips',
      description: 'Get expert advice on animal care',
      icon: 'medkit-outline',
      color: '#2E7D32',
    },
    {
      id: '2',
      title: 'Disease Guide',
      description: 'Learn about common livestock diseases',
      icon: 'book-outline',
      color: '#FF9800',
    },
    {
      id: '3',
      title: 'Vaccination Schedule',
      description: 'Track vaccination dates for your animals',
      icon: 'calendar-outline',
      color: '#2196F3',
    },
    {
      id: '4',
      title: 'Market Prices',
      description: 'Check current livestock market prices',
      icon: 'trending-up-outline',
      color: '#4CAF50',
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <Text style={styles.headerSubtitle}>Discover helpful resources</Text>
      </View>

      <View style={styles.featuresGrid}>
        {features.map((feature) => (
          <TouchableOpacity key={feature.id} style={styles.featureCard}>
            <View style={[styles.iconContainer, { backgroundColor: feature.color + '20' }]}>
              <Ionicons name={feature.icon as any} size={32} color={feature.color} />
            </View>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureDescription}>{feature.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>Quick Tips</Text>
        
        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={24} color="#FF9800" />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Regular Checkups</Text>
            <Text style={styles.tipText}>Schedule regular health checkups for your animals</Text>
          </View>
        </View>
        
        <View style={styles.tipCard}>
          <Ionicons name="water-outline" size={24} color="#2196F3" />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Clean Water</Text>
            <Text style={styles.tipText}>Ensure your animals have access to clean water</Text>
          </View>
        </View>
        
        <View style={styles.tipCard}>
          <Ionicons name="nutrition-outline" size={24} color="#4CAF50" />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Balanced Diet</Text>
            <Text style={styles.tipText}>Provide a balanced diet for optimal health</Text>
          </View>
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
  header: {
    backgroundColor: '#2E7D32',
    padding: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E8F5E9',
    marginTop: 4,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  featureCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
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
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  tipsSection: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    gap: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  tipText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});