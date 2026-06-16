// src/app/(vet)/explore.tsx
import { useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Linking,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { api } from '../../api/axios';
import { useAuthStore } from '../../store/auth-store';

type VeterinaryResource = {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url?: string;
  link?: string;
  created_at: string;
};

type DiseaseInfo = {
  id: string;
  name: string;
  symptoms: string[];
  treatment: string;
  prevention: string;
  species: string[];
};

const DISEASES: DiseaseInfo[] = [
  {
    id: '1',
    name: 'Foot and Mouth Disease',
    symptoms: ['Fever', 'Blisters in mouth and on feet', 'Loss of appetite', 'Reduced milk production'],
    treatment: 'Supportive care, antiseptics for blisters, antibiotics for secondary infections',
    prevention: 'Vaccination, quarantine new animals, biosecurity measures',
    species: ['Cattle', 'Sheep', 'Goats', 'Pigs'],
  },
  {
    id: '2',
    name: 'Mastitis',
    symptoms: ['Swollen udder', 'Abnormal milk', 'Fever', 'Reduced appetite'],
    treatment: 'Antibiotics, anti-inflammatory drugs, frequent milking',
    prevention: 'Proper milking hygiene, dry cow therapy, teat dipping',
    species: ['Cattle', 'Goats', 'Sheep'],
  },
  {
    id: '3',
    name: 'Newcastle Disease',
    symptoms: ['Respiratory distress', 'Diarrhea', 'Nervous signs', 'Sudden death'],
    treatment: 'Supportive care, no specific treatment',
    prevention: 'Vaccination, biosecurity, quarantine',
    species: ['Chickens', 'Poultry'],
  },
];

const RESOURCES: VeterinaryResource[] = [
  {
    id: '1',
    title: 'Veterinary Emergency Guidelines',
    description: 'Step-by-step guide for handling common veterinary emergencies',
    category: 'Guide',
    link: 'https://www.avma.org/resources-tools/emergency-preparedness',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Vaccination Schedule for Livestock',
    description: 'Recommended vaccination schedule for cattle, goats, and poultry',
    category: 'Reference',
    link: 'https://www.oie.int/standard-setting/terrestrial-manual/',
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Zoonotic Disease Prevention',
    description: 'How to protect yourself from animal-to-human diseases',
    category: 'Safety',
    link: 'https://www.cdc.gov/onehealth/index.html',
    created_at: new Date().toISOString(),
  },
];

export default function VetExploreScreen() {
  const [resources, setResources] = useState<VeterinaryResource[]>(RESOURCES);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDisease, setSelectedDisease] = useState<DiseaseInfo | null>(null);
  const [showDiseaseModal, setShowDiseaseModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { token } = useAuthStore();

  const categories = ['All', 'Guide', 'Reference', 'Safety', 'Article'];

  const fetchResources = async () => {
    try {
      if (!token) {
        console.log('No token found');
        return;
      }

      setLoading(true);
      const response = await api.get('/vet/resources');
      const resourcesData = response.data.data || response.data;
      setResources(resourcesData);
    } catch (error: any) {
      console.log('Fetch resources error:', error?.response?.data);
      // Use mock data if API fails
      setResources(RESOURCES);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchResources();
    }, [token])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchResources();
  };

  const handleOpenLink = async (url: string) => {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'Cannot open this link');
    }
  };

  const handleEmergencyCall = () => {
    Alert.alert(
      'Emergency Hotline',
      'Select an emergency number to call',
      [
        { text: 'Veterinary Emergency: 112', onPress: () => Linking.openURL('tel:112') },
        { text: 'Animal Disease Hotline: 101', onPress: () => Linking.openURL('tel:101') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'How would you like to contact us?',
      [
        { text: 'Call: +250 788 123 456', onPress: () => Linking.openURL('tel:+250788123456') },
        { text: 'Email: support@vetconnect.rw', onPress: () => Linking.openURL('mailto:support@vetconnect.rw') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const filteredResources = resources.filter(resource => {
    const matchesCategory = selectedCategory === 'All' || resource.category === selectedCategory;
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredDiseases = DISEASES.filter(disease =>
    disease.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Guide': return '#2196F3';
      case 'Reference': return '#4CAF50';
      case 'Safety': return '#FF9800';
      case 'Article': return '#9C27B0';
      default: return '#666';
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading resources...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#2196F3']}
          tintColor="#2196F3"
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Veterinary Resources</Text>
        <Text style={styles.headerSubtitle}>
          Professional tools and information for veterinary practice
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search resources or diseases..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Emergency Section */}
      <View style={styles.emergencySection}>
        <Text style={styles.sectionTitle}>Emergency & Support</Text>
        <View style={styles.emergencyButtons}>
          <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergencyCall}>
            <Ionicons name="call-outline" size={24} color="#fff" />
            <Text style={styles.emergencyButtonText}>Emergency Hotline</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.supportButton} onPress={handleContactSupport}>
            <Ionicons name="chatbubble-outline" size={24} color="#2196F3" />
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Disease Database */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Disease Database</Text>
        <Text style={styles.sectionSubtitle}>
          Common livestock diseases and treatment guidelines
        </Text>
        
        {filteredDiseases.map((disease) => (
          <TouchableOpacity
            key={disease.id}
            style={styles.diseaseCard}
            onPress={() => {
              setSelectedDisease(disease);
              setShowDiseaseModal(true);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.diseaseHeader}>
              <Text style={styles.diseaseName}>{disease.name}</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </View>
            <Text style={styles.diseaseSpecies}>
              Affects: {disease.species.join(', ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category Filters */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resources</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryChipText,
                selectedCategory === category && styles.categoryChipTextActive,
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Resources List */}
      {filteredResources.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No resources found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your search or category filter</Text>
        </View>
      ) : (
        <View style={styles.resourcesList}>
          {filteredResources.map((resource) => (
            <TouchableOpacity
              key={resource.id}
              style={styles.resourceCard}
              onPress={() => resource.link && handleOpenLink(resource.link)}
              activeOpacity={0.7}
            >
              <View style={styles.resourceHeader}>
                <View style={[styles.resourceCategory, { backgroundColor: getCategoryColor(resource.category) + '20' }]}>
                  <Text style={[styles.resourceCategoryText, { color: getCategoryColor(resource.category) }]}>
                    {resource.category}
                  </Text>
                </View>
                <Ionicons name="open-outline" size={20} color="#666" />
              </View>
              <Text style={styles.resourceTitle}>{resource.title}</Text>
              <Text style={styles.resourceDescription}>{resource.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Veterinary Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>Quick Veterinary Tips</Text>
        <View style={styles.tipCard}>
          <Ionicons name="medkit-outline" size={24} color="#2196F3" />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Always wash hands</Text>
            <Text style={styles.tipText}>
              Proper hygiene prevents disease transmission between animals and humans
            </Text>
          </View>
        </View>
        <View style={styles.tipCard}>
          <Ionicons name="thermometer-outline" size={24} color="#FF9800" />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Monitor vital signs</Text>
            <Text style={styles.tipText}>
              Regular temperature and health checks can catch issues early
            </Text>
          </View>
        </View>
        <View style={styles.tipCard}>
          <Ionicons name="calendar-outline" size={24} color="#4CAF50" />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Keep vaccination records</Text>
            <Text style={styles.tipText}>
              Maintain detailed health records for all animals under your care
            </Text>
          </View>
        </View>
      </View>

      {/* Disease Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showDiseaseModal}
        onRequestClose={() => setShowDiseaseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedDisease?.name}</Text>
              <TouchableOpacity onPress={() => setShowDiseaseModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Symptoms</Text>
                {selectedDisease?.symptoms.map((symptom, index) => (
                  <View key={index} style={styles.bulletPoint}>
                    <Ionicons name="checkmark-circle" size={16} color="#f44336" />
                    <Text style={styles.bulletText}>{symptom}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Treatment</Text>
                <Text style={styles.modalText}>{selectedDisease?.treatment}</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Prevention</Text>
                <Text style={styles.modalText}>{selectedDisease?.prevention}</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Affected Species</Text>
                <View style={styles.speciesContainer}>
                  {selectedDisease?.species.map((species, index) => (
                    <View key={index} style={styles.speciesBadge}>
                      <Text style={styles.speciesText}>{species}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingBottom: 25,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E3F2FD',
    marginTop: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  emergencySection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  emergencyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  emergencyButton: {
    flex: 1,
    backgroundColor: '#f44336',
    padding: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emergencyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  supportButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  supportButtonText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  categoryScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryChipActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  diseaseCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 8,
  },
  diseaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  diseaseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  diseaseSpecies: {
    fontSize: 12,
    color: '#666',
  },
  resourcesList: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  resourceCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resourceCategory: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resourceCategoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  resourceDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
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
  tipsSection: {
    marginHorizontal: 16,
    marginBottom: 30,
  },
  tipCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  bulletText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  speciesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  speciesBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  speciesText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
  },
});