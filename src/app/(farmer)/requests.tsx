// src/app/(farmer)/requests.tsx
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { api } from '../../api/axios';
import { useAuthStore } from '../../store/auth-store';

type Request = {
  id: string;
  animal_name: string;
  animal_category: string;
  issue_type: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'emergency';
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  veterinarian?: {
    id: string;
    name: string;
    phone: string;
  };
  preferred_date?: string;
  created_at: string;
};

type NewRequest = {
  animal_id: string;
  issue_type: string;
  description: string;
  priority: string;
  preferred_date?: string;
};

const ISSUE_TYPES = [
  'Vaccination',
  'Sickness',
  'Injury',
  'Pregnancy Check',
  'Nutrition Consultation',
  'Emergency',
  'Routine Checkup',
  'Other',
];

const PRIORITIES = [
  { label: 'Low', value: 'low', color: '#4CAF50' },
  { label: 'Medium', value: 'medium', color: '#FF9800' },
  { label: 'High', value: 'high', color: '#f44336' },
  { label: 'Emergency', value: 'emergency', color: '#9C27B0' },
];

export default function RequestsScreen() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [animals, setAnimals] = useState<any[]>([]);
  
  const { token, user } = useAuthStore();
  
  // New request form state
  const [newRequest, setNewRequest] = useState<NewRequest>({
    animal_id: '',
    issue_type: '',
    description: '',
    priority: 'medium',
    preferred_date: '',
  });

  const fetchRequests = async () => {
    try {
      if (!token) {
        console.log('No token found');
        return;
      }

      console.log('Fetching requests...');
      const response = await api.get('/farmer/requests');
      
      const requestsData = Array.isArray(response.data) 
        ? response.data 
        : response.data?.data || [];
      
      setRequests(requestsData);
    } catch (error: any) {
      console.log('Fetch error:', error?.response?.data || error.message);
      
      if (error?.response?.status === 404) {
        // Use mock data for demo
        setRequests([
          {
            id: '1',
            animal_name: 'Bella',
            animal_category: 'Cow',
            issue_type: 'Sickness',
            description: 'Not eating properly and seems weak',
            priority: 'high',
            status: 'pending',
            created_at: new Date().toISOString(),
          },
          {
            id: '2',
            animal_name: 'Molly',
            animal_category: 'Goat',
            issue_type: 'Vaccination',
            description: 'Due for annual vaccination',
            priority: 'medium',
            status: 'accepted',
            veterinarian: {
              id: '1',
              name: 'Dr. John Doe',
              phone: '0788888888',
            },
            created_at: new Date().toISOString(),
          },
        ]);
      } else if (error?.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again');
        router.replace('/(auth)/login');
      } else {
        Alert.alert('Error', 'Failed to load requests');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAnimals = async () => {
    try {
      const response = await api.get('/farmer/animals');
      const animalsData = Array.isArray(response.data) 
        ? response.data 
        : response.data?.data || [];
      setAnimals(animalsData);
    } catch (error: any) {
      console.log('Fetch animals error:', error?.response?.data);
      // Mock animals if endpoint not ready
      setAnimals([
        { id: '1', name: 'Bella', category: 'Cow' },
        { id: '2', name: 'Molly', category: 'Goat' },
      ]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRequests();
    }, [token])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const openNewRequestModal = async () => {
    await fetchAnimals();
    setNewRequest({
      animal_id: '',
      issue_type: '',
      description: '',
      priority: 'medium',
      preferred_date: '',
    });
    setModalVisible(true);
  };

  const submitRequest = async () => {
    // Validation
    if (!newRequest.animal_id) {
      Alert.alert('Error', 'Please select an animal');
      return;
    }
    if (!newRequest.issue_type) {
      Alert.alert('Error', 'Please select an issue type');
      return;
    }
    if (!newRequest.description.trim()) {
      Alert.alert('Error', 'Please provide a description');
      return;
    }

    setSubmitting(true);
    
    try {
      const payload = {
        ...newRequest,
        preferred_date: newRequest.preferred_date || null,
      };
      
      console.log('Submitting request:', payload);
      
      const response = await api.post('/farmer/requests', payload);
      
      Alert.alert('Success', 'Your veterinary request has been submitted!');
      setModalVisible(false);
      fetchRequests(); // Refresh the list
      
    } catch (error: any) {
      console.log('Submit error:', error?.response?.data);
      
      if (error?.response?.status === 404) {
        // Mock success for demo
        Alert.alert('Success', 'Your veterinary request has been submitted! (Demo)');
        setModalVisible(false);
        fetchRequests();
      } else {
        Alert.alert('Error', error?.response?.data?.message || 'Failed to submit request');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const cancelRequest = async (requestId: string) => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.put(`/farmer/requests/${requestId}/cancel`);
              Alert.alert('Success', 'Request cancelled');
              fetchRequests();
            } catch (error: any) {
              Alert.alert('Error', 'Failed to cancel request');
            }
          },
        },
      ]
    );
  };

  const viewRequestDetails = (requestId: string) => {
    // Use a valid route path that exists in your app
    router.push({
      pathname: '/(farmer)/requests/[id]',
      params: { id: requestId }
    } as any);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'accepted': return '#2196F3';
      case 'in_progress': return '#9C27B0';
      case 'completed': return '#4CAF50';
      case 'cancelled': return '#f44336';
      default: return '#999';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'accepted': return 'Accepted';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'high': return '#f44336';
      case 'emergency': return '#9C27B0';
      default: return '#999';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-RW', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderRequestCard = ({ item }: { item: Request }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => viewRequestDetails(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.animalName}>{item.animal_name}</Text>
          <Text style={styles.issueType}>{item.issue_type}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>
      
      <Text style={styles.description} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.cardFooter}>
        <View style={styles.priorityContainer}>
          <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(item.priority) }]} />
          <Text style={styles.priorityText}>
            {item.priority.toUpperCase()}
          </Text>
        </View>
        
        <Text style={styles.date}>
          {formatDate(item.created_at)}
        </Text>
      </View>
      
      {item.status === 'pending' && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => cancelRequest(item.id)}
        >
          <Text style={styles.cancelButtonText}>Cancel Request</Text>
        </TouchableOpacity>
      )}
      
      {item.veterinarian && (
        <View style={styles.vetInfo}>
          <Ionicons name="medkit-outline" size={16} color="#2E7D32" />
          <Text style={styles.vetName}>Assigned: {item.veterinarian.name}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Veterinary Requests</Text>
        <Text style={styles.headerSubtitle}>
          {requests.length} request{requests.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Add Request Button */}
      <TouchableOpacity style={styles.addButton} onPress={openNewRequestModal}>
        <Ionicons name="add-circle-outline" size={24} color="#fff" />
        <Text style={styles.addButtonText}>New Veterinary Request</Text>
      </TouchableOpacity>

      {/* Requests List */}
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderRequestCard}
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
            <Ionicons name="chatbubbles-outline" size={80} color="#ccc" />
            <Text style={styles.emptyText}>No requests yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the button above to request veterinary assistance
            </Text>
          </View>
        }
        contentContainerStyle={requests.length === 0 ? styles.emptyList : styles.list}
      />

      {/* New Request Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Request</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Animal Selection */}
              <Text style={styles.modalLabel}>Select Animal *</Text>
              <View style={styles.animalList}>
                {animals.map((animal) => (
                  <TouchableOpacity
                    key={animal.id}
                    style={[
                      styles.animalOption,
                      newRequest.animal_id === animal.id && styles.animalOptionActive,
                    ]}
                    onPress={() => setNewRequest({ ...newRequest, animal_id: animal.id })}
                  >
                    <Text style={[
                      styles.animalOptionText,
                      newRequest.animal_id === animal.id && styles.animalOptionTextActive,
                    ]}>
                      {animal.name} ({animal.category})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Issue Type */}
              <Text style={styles.modalLabel}>Issue Type *</Text>
              <View style={styles.issueList}>
                {ISSUE_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.issueOption,
                      newRequest.issue_type === type && styles.issueOptionActive,
                    ]}
                    onPress={() => setNewRequest({ ...newRequest, issue_type: type })}
                  >
                    <Text style={[
                      styles.issueOptionText,
                      newRequest.issue_type === type && styles.issueOptionTextActive,
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Priority */}
              <Text style={styles.modalLabel}>Priority *</Text>
              <View style={styles.priorityList}>
                {PRIORITIES.map((priority) => (
                  <TouchableOpacity
                    key={priority.value}
                    style={[
                      styles.priorityOption,
                      newRequest.priority === priority.value && { borderColor: priority.color },
                    ]}
                    onPress={() => setNewRequest({ ...newRequest, priority: priority.value })}
                  >
                    <Text style={[
                      styles.priorityOptionText,
                      newRequest.priority === priority.value && { color: priority.color },
                    ]}>
                      {priority.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Description */}
              <Text style={styles.modalLabel}>Description *</Text>
              <TextInput
                style={styles.modalTextArea}
                placeholder="Describe the issue in detail..."
                multiline
                numberOfLines={4}
                value={newRequest.description}
                onChangeText={(text) => setNewRequest({ ...newRequest, description: text })}
              />
              
              {/* Preferred Date (Optional) */}
              <Text style={styles.modalLabel}>Preferred Date (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., Tomorrow, This week, Next Monday"
                value={newRequest.preferred_date}
                onChangeText={(text) => setNewRequest({ ...newRequest, preferred_date: text })}
              />
              
              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={submitRequest}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Request</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  header: {
    backgroundColor: '#2E7D32',
    padding: 20,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E8F5E9',
    marginTop: 5,
  },
  addButton: {
    backgroundColor: '#2E7D32',
    margin: 16,
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 2,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyList: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  animalName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B5E20',
  },
  issueType: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  cancelButton: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#f44336',
    fontSize: 12,
    fontWeight: '600',
  },
  vetInfo: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vetName: {
    fontSize: 12,
    color: '#2E7D32',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    textAlign: 'center',
    paddingHorizontal: 40,
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
    color: '#1B5E20',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 8,
  },
  animalList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  animalOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  animalOptionActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  animalOptionText: {
    fontSize: 14,
    color: '#333',
  },
  animalOptionTextActive: {
    color: '#fff',
  },
  issueList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  issueOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  issueOptionActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  issueOptionText: {
    fontSize: 14,
    color: '#333',
  },
  issueOptionTextActive: {
    color: '#fff',
  },
  priorityList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  priorityOption: {
    flex: 1,
    minWidth: '22%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  priorityOptionText: {
    fontSize: 12,
    color: '#666',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  modalTextArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#2E7D32',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});