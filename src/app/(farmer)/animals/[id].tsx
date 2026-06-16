// src/app/(farmer)/animals/[id].tsx
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { api } from '../../../api/axios';
import { useAuthStore } from '../../../store/auth-store';

type Animal = {
  id: string;
  name: string;
  category: string;
  breed: string;
  age: number;
  weight: number;
  health_status: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

const HEALTH_STATUSES = ['Healthy', 'Sick', 'Recovering', 'Under Treatment', 'Pregnant'];
const CATEGORIES = ['Cow', 'Goat', 'Sheep', 'Pig', 'Chicken', 'Rabbit', 'Other'];

export default function AnimalDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const { token } = useAuthStore();
  
  const [editForm, setEditForm] = useState({
    name: '',
    category: '',
    breed: '',
    age: '',
    weight: '',
    health_status: '',
    notes: '',
  });

  const fetchAnimal = async () => {
    try {
      if (!token) {
        console.log('No token found');
        return;
      }

      console.log('Fetching animal details for id:', id);
      const response = await api.get(`/farmer/animals/${id}`);
      
      const animalData = response.data.data || response.data;
      setAnimal(animalData);
      
      // Initialize edit form
      setEditForm({
        name: animalData.name || '',
        category: animalData.category || '',
        breed: animalData.breed || '',
        age: animalData.age?.toString() || '',
        weight: animalData.weight?.toString() || '',
        health_status: animalData.health_status || 'Healthy',
        notes: animalData.notes || '',
      });
      
    } catch (error: any) {
      console.log('Fetch animal error:', error?.response?.data || error.message);
      
      if (error?.response?.status === 404) {
        // Use mock data for demo
        const mockAnimal = {
          id: id,
          name: 'Bella',
          category: 'Cow',
          breed: 'Friesian',
          age: 3,
          weight: 450,
          health_status: 'Healthy',
          notes: 'Very friendly and productive',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setAnimal(mockAnimal);
        setEditForm({
          name: mockAnimal.name,
          category: mockAnimal.category,
          breed: mockAnimal.breed,
          age: mockAnimal.age.toString(),
          weight: mockAnimal.weight.toString(),
          health_status: mockAnimal.health_status,
          notes: mockAnimal.notes,
        });
      } else if (error?.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again');
        router.replace('/(auth)/login');
      } else {
        Alert.alert('Error', 'Failed to load animal details');
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAnimal();
    }, [token, id])
  );

  const handleUpdateAnimal = async () => {
    if (!editForm.name.trim()) {
      Alert.alert('Error', 'Animal name is required');
      return;
    }
    
    setUpdating(true);
    
    try {
      const payload = {
        name: editForm.name.trim(),
        category: editForm.category,
        breed: editForm.breed.trim() || null,
        age: editForm.age ? parseInt(editForm.age) : null,
        weight: editForm.weight ? parseFloat(editForm.weight) : null,
        health_status: editForm.health_status.toLowerCase(),
        notes: editForm.notes.trim() || null,
      };
      
      const response = await api.put(`/farmer/animals/${id}`, payload);
      
      Alert.alert('Success', 'Animal updated successfully');
      setEditing(false);
      fetchAnimal(); // Refresh animal data
      
    } catch (error: any) {
      console.log('Update error:', error?.response?.data);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update animal');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateHealth = async (newHealthStatus: string) => {
    setUpdating(true);
    
    try {
      const response = await api.patch(`/farmer/animals/${id}/health`, {
        health_status: newHealthStatus.toLowerCase(),
      });
      
      Alert.alert('Success', 'Health status updated');
      setShowHealthModal(false);
      fetchAnimal(); // Refresh animal data
      
    } catch (error: any) {
      console.log('Update health error:', error?.response?.data);
      Alert.alert('Error', 'Failed to update health status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAnimal = () => {
    Alert.alert(
      'Delete Animal',
      `Are you sure you want to delete ${animal?.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/farmer/animals/${id}`);
              Alert.alert('Success', 'Animal deleted successfully');
              router.back();
            } catch (error: any) {
              console.log('Delete error:', error?.response?.data);
              Alert.alert('Error', 'Failed to delete animal');
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
      default: return '#999';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-RW', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading animal details...</Text>
      </View>
    );
  }

  if (!animal) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="sad-outline" size={60} color="#ccc" />
        <Text style={styles.errorText}>Animal not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with Actions */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          {!editing && (
            <>
              <TouchableOpacity onPress={() => setEditing(true)} style={styles.editIcon}>
                <Ionicons name="create-outline" size={24} color="#2E7D32" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeleteAnimal} style={styles.deleteIcon}>
                <Ionicons name="trash-outline" size={24} color="#f44336" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Animal Icon */}
      <View style={styles.iconContainer}>
        <View style={styles.animalIcon}>
          <Text style={styles.animalIconEmoji}>
            {animal.category === 'Cow' ? '🐄' : 
             animal.category === 'Goat' ? '🐐' : 
             animal.category === 'Sheep' ? '🐑' : 
             animal.category === 'Pig' ? '🐷' : 
             animal.category === 'Chicken' ? '🐔' : '🐾'}
          </Text>
        </View>
      </View>

      {/* Health Status Badge */}
      <View style={styles.healthStatusContainer}>
        <TouchableOpacity 
          style={[styles.healthBadge, { backgroundColor: getHealthStatusColor(animal.health_status) + '20' }]}
          onPress={() => setShowHealthModal(true)}
          disabled={editing}
        >
          <View style={[styles.healthDot, { backgroundColor: getHealthStatusColor(animal.health_status) }]} />
          <Text style={[styles.healthText, { color: getHealthStatusColor(animal.health_status) }]}>
            {animal.health_status?.toUpperCase() || 'UNKNOWN'}
          </Text>
          {!editing && <Ionicons name="chevron-down" size={16} color={getHealthStatusColor(animal.health_status)} />}
        </TouchableOpacity>
      </View>

      {editing ? (
        // Edit Mode
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Animal Name *</Text>
            <TextInput
              style={styles.input}
              value={editForm.name}
              onChangeText={(text) => setEditForm({ ...editForm, name: text })}
              placeholder="Enter animal name"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryContainer}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    editForm.category === cat && styles.categoryChipActive,
                  ]}
                  onPress={() => setEditForm({ ...editForm, category: cat })}
                >
                  <Text style={[
                    styles.categoryChipText,
                    editForm.category === cat && styles.categoryChipTextActive,
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfField]}>
              <Text style={styles.label}>Breed</Text>
              <TextInput
                style={styles.input}
                value={editForm.breed}
                onChangeText={(text) => setEditForm({ ...editForm, breed: text })}
                placeholder="e.g., Friesian"
              />
            </View>

            <View style={[styles.inputContainer, styles.halfField]}>
              <Text style={styles.label}>Age (Years)</Text>
              <TextInput
                style={styles.input}
                value={editForm.age}
                onChangeText={(text) => setEditForm({ ...editForm, age: text })}
                placeholder="Age"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfField]}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={editForm.weight}
                onChangeText={(text) => setEditForm({ ...editForm, weight: text })}
                placeholder="Weight"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={editForm.notes}
              onChangeText={(text) => setEditForm({ ...editForm, notes: text })}
              placeholder="Additional notes about the animal"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.editActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => {
                setEditing(false);
                if (animal) {
                  setEditForm({
                    name: animal.name,
                    category: animal.category,
                    breed: animal.breed,
                    age: animal.age?.toString() || '',
                    weight: animal.weight?.toString() || '',
                    health_status: animal.health_status,
                    notes: animal.notes || '',
                  });
                }
              }}
              disabled={updating}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleUpdateAnimal}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // View Mode
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Ionicons name="paw-outline" size={22} color="#666" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Name</Text>
              <Text style={styles.detailValue}>{animal.name}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="apps-outline" size={22} color="#666" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{animal.category}</Text>
            </View>
          </View>

          {animal.breed && (
            <View style={styles.detailRow}>
              <Ionicons name="git-branch-outline" size={22} color="#666" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Breed</Text>
                <Text style={styles.detailValue}>{animal.breed}</Text>
              </View>
            </View>
          )}

          {animal.age > 0 && (
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={22} color="#666" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Age</Text>
                <Text style={styles.detailValue}>{animal.age} {animal.age === 1 ? 'year' : 'years'}</Text>
              </View>
            </View>
          )}

          {animal.weight > 0 && (
            <View style={styles.detailRow}>
              <Ionicons name="fitness-outline" size={22} color="#666" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Weight</Text>
                <Text style={styles.detailValue}>{animal.weight} kg</Text>
              </View>
            </View>
          )}

          {animal.notes && (
            <View style={styles.detailRow}>
              <Ionicons name="document-text-outline" size={22} color="#666" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Notes</Text>
                <Text style={styles.detailValue}>{animal.notes}</Text>
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={22} color="#666" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Added On</Text>
              <Text style={styles.detailValue}>{formatDate(animal.created_at)}</Text>
            </View>
          </View>

          {animal.updated_at !== animal.created_at && (
            <View style={styles.detailRow}>
              <Ionicons name="refresh-outline" size={22} color="#666" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Last Updated</Text>
                <Text style={styles.detailValue}>{formatDate(animal.updated_at)}</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Health Status Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showHealthModal}
        onRequestClose={() => setShowHealthModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Health Status</Text>
              <TouchableOpacity onPress={() => setShowHealthModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {HEALTH_STATUSES.map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.healthOption,
                  animal.health_status === status && styles.healthOptionActive,
                ]}
                onPress={() => handleUpdateHealth(status)}
                disabled={updating}
              >
                <View style={[styles.healthOptionDot, { backgroundColor: getHealthStatusColor(status) }]} />
                <Text style={[
                  styles.healthOptionText,
                  animal.health_status === status && styles.healthOptionTextActive,
                ]}>
                  {status}
                </Text>
                {animal.health_status === status && (
                  <Ionicons name="checkmark" size={20} color="#2E7D32" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backIcon: {
    padding: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  editIcon: {
    padding: 4,
  },
  deleteIcon: {
    padding: 4,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  animalIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  animalIconEmoji: {
    fontSize: 50,
  },
  healthStatusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  healthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
  },
  form: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  categoryChipActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  categoryChipText: {
    fontSize: 12,
    color: '#666',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2E7D32',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  healthOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    marginBottom: 8,
    gap: 12,
  },
  healthOptionActive: {
    backgroundColor: '#E8F5E9',
  },
  healthOptionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  healthOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  healthOptionTextActive: {
    fontWeight: '600',
    color: '#2E7D32',
  },
});