// ============================================================
// FILE: src/app/(farmer)/explore.tsx
// DESCRIPTION: Explore screen for farmers - resources and tips
// ============================================================

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
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
      route: '/(farmer)/vet-tips',
    },
    {
      id: '2',
      title: 'Disease Guide',
      description: 'Learn about common livestock diseases',
      icon: 'book-outline',
      color: '#FF9800',
      route: '/(farmer)/disease-guide',
    },
    {
      id: '3',
      title: 'Vaccination Schedule',
      description: 'Track vaccination dates for your animals',
      icon: 'calendar-outline',
      color: '#2196F3',
      route: '/(farmer)/vaccination-schedule',
    },
    {
      id: '4',
      title: 'Market Prices',
      description: 'Check current livestock market prices',
      icon: 'trending-up-outline',
      color: '#4CAF50',
      route: '/(farmer)/market-prices',
    },
    {
      id: '5',
      title: 'AI Assistant',
      description: 'Get instant answers from our AI',
      icon: 'chatbubble-ellipses-outline',
      color: '#9C27B0',
      route: '/(farmer)/ai-chat',
    },
    {
      id: '6',
      title: 'Public Chat',
      description: 'Connect with other farmers and vets',
      icon: 'people-outline',
      color: '#D32F2F',
      route: '/(farmer)/public-chat',
    },
  ];

  const handleFeaturePress = (feature: typeof features[0]) => {
    // Check if route exists, if not show coming soon
    if (feature.route) {
      router.push(feature.route as any);
    } else {
      Alert.alert('Coming Soon', `${feature.title} feature will be available soon!`);
    }
  };

  const quickTips = [
    {
      id: '1',
      icon: 'bulb-outline',
      title: 'Regular Checkups',
      description: 'Schedule regular health checkups for your animals to catch issues early.',
      color: '#FF9800',
    },
    {
      id: '2',
      icon: 'water-outline',
      title: 'Clean Water',
      description: 'Ensure your animals have access to clean, fresh water at all times.',
      color: '#2196F3',
    },
    {
      id: '3',
      icon: 'nutrition-outline',
      title: 'Balanced Diet',
      description: 'Provide a balanced diet with proper nutrients for optimal health.',
      color: '#4CAF50',
    },
    {
      id: '4',
      icon: 'home-outline',
      title: 'Proper Shelter',
      description: 'Ensure your animals have proper shelter from extreme weather conditions.',
      color: '#795548',
    },
    {
      id: '5',
      icon: 'medkit-outline',
      title: 'First Aid Kit',
      description: 'Keep a well-stocked first aid kit for your livestock emergencies.',
      color: '#D32F2F',
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <Text style={styles.headerSubtitle}>Discover helpful resources</Text>
      </View>

      {/* Features Grid */}
      <View style={styles.featuresGrid}>
        {features.map((feature) => (
          <TouchableOpacity
            key={feature.id}
            style={styles.featureCard}
            onPress={() => handleFeaturePress(feature)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: feature.color + '20' }]}>
              <Ionicons name={feature.icon as any} size={32} color={feature.color} />
            </View>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureDescription}>{feature.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Tips Section */}
      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>💡 Quick Tips</Text>
        <Text style={styles.sectionSubtitle}>Essential tips for livestock care</Text>

        {quickTips.map((tip) => (
          <TouchableOpacity key={tip.id} style={styles.tipCard} activeOpacity={0.7}>
            <View style={[styles.tipIconContainer, { backgroundColor: tip.color + '20' }]}>
              <Ionicons name={tip.icon as any} size={24} color={tip.color} />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>{tip.title}</Text>
              <Text style={styles.tipText}>{tip.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Emergency Contact */}
      <View style={styles.emergencySection}>
        <Text style={styles.sectionTitle}>🆘 Emergency</Text>
        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={() => {
            Alert.alert(
              'Emergency Contact',
              'Veterinary Emergency Services\n\n📞 Call: 112\n📞 Vet Emergency: 0788-123-456',
              [
                { text: 'Call 112', onPress: () => console.log('Calling 112') },
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          }}
        >
          <Ionicons name="call-outline" size={24} color="#fff" />
          <View>
            <Text style={styles.emergencyTitle}>Emergency Veterinary Help</Text>
            <Text style={styles.emergencySubtitle}>24/7 support available</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
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
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
  },
  tipIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
    lineHeight: 16,
  },
  emergencySection: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D32F2F',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    elevation: 2,
  },
  emergencyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  emergencySubtitle: {
    fontSize: 12,
    color: '#FFCDD2',
    marginTop: 2,
  },
});