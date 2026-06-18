// src/app/(admin)/admin-management.tsx
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Modal,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/axios';
import { useAuthStore } from '../../store/auth-store';

type User = {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  role: string;
  status: string;
  is_verified: boolean;
  district_id?: number;
  district_name?: string;
  created_at: string;
};

type NewAdmin = {
  full_name: string;
  phone: string;
  email: string;
  password: string;
  role: string;
  district_id: number;
};

export default function AdminManagementScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [veterinarians, setVeterinarians] = useState<User[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [selectedVet, setSelectedVet] = useState<User | null>(null);
  const { token } = useAuthStore();

  const [newAdmin, setNewAdmin] = useState<NewAdmin>({
    full_name: '',
    phone: '',
    email: '',
    password: '',
    role: 'district_admin',
    district_id: 1,
  });

  // ✅ Load users
  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users');
      const data = response.data.data || response.data;

      // Filter users by role
      const allUsers = Array.isArray(data) ? data : [];
      const vets = allUsers.filter((u: User) => u.role === 'veterinarian' && u.status !== 'rejected');
      const adminsList = allUsers.filter((u: User) => 
        u.role === 'district_admin' || u.role === 'super_admin'
      );

      setVeterinarians(vets);
      setAdmins(adminsList);
    } catch (err: any) {
      console.log('Load users error:', err);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [token])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  // ✅ Create new admin
  const handleCreateAdmin = async () => {
    if (!newAdmin.full_name || !newAdmin.phone || !newAdmin.email || !newAdmin.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newAdmin.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      await api.post('/admin/users', newAdmin);
      Alert.alert('Success', 'Admin created successfully');
      setShowCreateModal(false);
      setNewAdmin({
        full_name: '',
        phone: '',
        email: '',
        password: '',
        role: 'district_admin',
        district_id: 1,
      });
      loadUsers();
    } catch (err: any) {
      console.log('Create admin error:', err);
      Alert.alert('Error', err?.response?.data?.message || 'Failed to create admin');
    }
  };

  // ✅ Convert veterinarian to admin
  const handleConvertToAdmin = async () => {
    if (!selectedVet) return;

    Alert.alert(
      'Convert to Admin',
      `Are you sure you want to convert ${selectedVet.full_name} from Veterinarian to District Admin?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Convert',
          onPress: async () => {
            try {
              await api.patch(`/admin/users/${selectedVet.id}/role`, {
                role: 'district_admin',
              });
              Alert.alert('Success', `${selectedVet.full_name} is now a District Admin`);
              setShowConvertModal(false);
              setSelectedVet(null);
              loadUsers();
            } catch (err: any) {
              console.log('Convert error:', err);
              Alert.alert('Error', err?.response?.data?.message || 'Failed to convert user');
            }
          },
        },
      ]
    );
  };

  const renderAdminCard = ({ item }: { item: User }) => (
    <View style={styles.adminCard}>
      <View style={styles.adminHeader}>
        <View>
          <Text style={styles.adminName}>{item.full_name}</Text>
          <Text style={styles.adminEmail}>{item.email}</Text>
        </View>
        <View style={[styles.roleBadge, styles.districtBadge]}>
          <Text style={styles.roleBadgeText}>
            {item.role === 'super_admin' ? 'SUPER ADMIN' : 'DISTRICT ADMIN'}
          </Text>
        </View>
      </View>
      <View style={styles.adminDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="call-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.phone}</Text>
        </View>
        {item.district_name && (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{item.district_name}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderVetCard = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.vetCard}
      onPress={() => {
        setSelectedVet(item);
        setShowConvertModal(true);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.vetHeader}>
        <View>
          <Text style={styles.vetName}>{item.full_name}</Text>
          <Text style={styles.vetEmail}>{item.email}</Text>
        </View>
        <TouchableOpacity 
          style={styles.convertButton}
          onPress={() => {
            setSelectedVet(item);
            setShowConvertModal(true);
          }}
        >
          <Text style={styles.convertButtonText}>Convert</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.vetDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="call-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.phone}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="medkit-outline" size={16} color="#666" />
          <Text style={styles.detailText}>Veterinarian</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D32F2F" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#D32F2F']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Management</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{admins.length}</Text>
            <Text style={styles.statLabel}>Total Admins</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{veterinarians.length}</Text>
            <Text style={styles.statLabel}>Veterinarians</Text>
          </View>
        </View>

        {/* Admins List */}
        <Text style={styles.sectionTitle}>Current Admins</Text>
        {admins.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No admins found</Text>
          </View>
        ) : (
          <FlatList
            data={admins}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderAdminCard}
            scrollEnabled={false}
            contentContainerStyle={styles.listContent}
          />
        )}

        {/* Veterinarians List (for conversion) */}
        <Text style={styles.sectionTitle}>Veterinarians</Text>
        <Text style={styles.sectionSubtitle}>
          Tap a veterinarian to convert them to District Admin
        </Text>
        {veterinarians.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No veterinarians found</Text>
          </View>
        ) : (
          <FlatList
            data={veterinarians}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderVetCard}
            scrollEnabled={false}
            contentContainerStyle={styles.listContent}
          />
        )}

        {/* Create Admin Button */}
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="person-add" size={20} color="#fff" />
          <Text style={styles.createButtonText}>Create New Admin</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Create Admin Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showCreateModal}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Admin</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  value={newAdmin.full_name}
                  onChangeText={(text) => setNewAdmin({ ...newAdmin, full_name: text })}
                  placeholder="Enter full name"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Phone *</Text>
                <TextInput
                  style={styles.input}
                  value={newAdmin.phone}
                  onChangeText={(text) => setNewAdmin({ ...newAdmin, phone: text })}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.input}
                  value={newAdmin.email}
                  onChangeText={(text) => setNewAdmin({ ...newAdmin, email: text })}
                  placeholder="Enter email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password *</Text>
                <TextInput
                  style={styles.input}
                  value={newAdmin.password}
                  onChangeText={(text) => setNewAdmin({ ...newAdmin, password: text })}
                  placeholder="Enter password (min 6 chars)"
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleCreateAdmin}
              >
                <Text style={styles.submitButtonText}>Create Admin</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Convert Veterinarian Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showConvertModal}
        onRequestClose={() => {
          setShowConvertModal(false);
          setSelectedVet(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Convert to Admin</Text>
              <TouchableOpacity onPress={() => {
                setShowConvertModal(false);
                setSelectedVet(null);
              }}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedVet && (
              <View>
                <View style={styles.convertInfo}>
                  <Text style={styles.convertName}>{selectedVet.full_name}</Text>
                  <Text style={styles.convertEmail}>{selectedVet.email}</Text>
                  <View style={styles.convertRoleBadge}>
                    <Text style={styles.convertRoleText}>Veterinarian → District Admin</Text>
                  </View>
                </View>

                <View style={styles.convertWarning}>
                  <Ionicons name="warning-outline" size={24} color="#FF9800" />
                  <Text style={styles.convertWarningText}>
                    This user will lose veterinarian permissions and gain admin permissions.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.convertConfirmButton}
                  onPress={handleConvertToAdmin}
                >
                  <Text style={styles.convertConfirmText}>Confirm Conversion</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelConvertButton}
                  onPress={() => {
                    setShowConvertModal(false);
                    setSelectedVet(null);
                  }}
                >
                  <Text style={styles.cancelConvertText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
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
  centerContainer: {
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
    backgroundColor: '#D32F2F',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#999',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  adminCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  adminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  adminName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  adminEmail: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  districtBadge: {
    backgroundColor: '#FF9800',
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  adminDetails: {
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
  },
  vetCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  vetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  vetEmail: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  convertButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  convertButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  vetDetails: {
    marginTop: 4,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    margin: 16,
    padding: 14,
    borderRadius: 10,
    gap: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
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
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
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
  submitButton: {
    backgroundColor: '#2E7D32',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  convertInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  convertName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  convertEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  convertRoleBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  convertRoleText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  convertWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    gap: 10,
    marginBottom: 20,
  },
  convertWarningText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  convertConfirmButton: {
    backgroundColor: '#D32F2F',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  convertConfirmText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelConvertButton: {
    padding: 12,
    alignItems: 'center',
  },
  cancelConvertText: {
    color: '#666',
    fontSize: 14,
  },
});