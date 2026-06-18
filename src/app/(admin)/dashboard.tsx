// src/app/(admin)/dashboard.tsx
import { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  StyleSheet,
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
  status: 'active' | 'pending' | 'suspended' | 'deactivated' | 'approved' | 'rejected';
  is_verified: boolean;
  district_id?: number;
  district_name?: string;
  created_at: string;
};

type DashboardStats = {
  total_users: number;
  total_farmers: number;
  total_veterinarians: number;
  pending_approvals: number;
  active_users: number;
  suspended_users: number;
};

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_users: 0,
    total_farmers: 0,
    total_veterinarians: 0,
    pending_approvals: 0,
    active_users: 0,
    suspended_users: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [createAdminModal, setCreateAdminModal] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    role: '',
  });
  const [newAdmin, setNewAdmin] = useState({
    full_name: '',
    phone: '',
    email: '',
    password: '',
    role: 'district_admin',
    district_id: 1,
  });
  const { user: currentUser, token, logout } = useAuthStore();

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isDistrictAdmin = currentUser?.role === 'district_admin';

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/(auth)/login');
            } catch (error) {
              console.log('Logout error:', error);
              router.replace('/(auth)/login');
            }
          },
        },
      ]
    );
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      const data = response.data.data || response.data;
      setStats({
        total_users: data.totalUsers || 0,
        total_farmers: data.totalFarmers || 0,
        total_veterinarians: data.totalVets || 0,
        pending_approvals: data.pendingUsers || 0,
        active_users: data.activeUsers || 0,
        suspended_users: data.suspendedUsers || 0,
      });
    } catch (err) {
      console.log('Error loading stats:', err);
      if (users.length > 0) {
        setStats({
          total_users: users.length,
          total_farmers: users.filter(u => u.role === 'farmer').length,
          total_veterinarians: users.filter(u => u.role === 'veterinarian').length,
          pending_approvals: users.filter(u => u.status === 'pending' || u.status === 'approved').length,
          active_users: users.filter(u => u.status === 'active').length,
          suspended_users: users.filter(u => u.status === 'suspended').length,
        });
      }
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('📥 Loading users from API...');
      
      const response = await api.get('/admin/users');
      console.log('📥 API Response:', response.data);
      
      const data = response.data.data || response.data;
      console.log('📥 Users data:', data);
      
      if (data && Array.isArray(data) && data.length > 0) {
        console.log('✅ Setting users:', data.length);
        setUsers(data);
      } else {
        console.log('⚠️ No users found in API response');
        setUsers([]);
      }
      
      await loadStats();
    } catch (err: any) {
      console.log('❌ Error loading users:', err?.response?.data || err);
      
      if (err?.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again');
        router.replace('/(auth)/login');
      } else {
        Alert.alert('Error', 'Failed to load users. Please pull to refresh.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (token) {
        loadUsers();
      }
    }, [token])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const createAdmin = async () => {
    if (!newAdmin.full_name || !newAdmin.phone || !newAdmin.email || !newAdmin.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newAdmin.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      const response = await api.post('/admin/users', newAdmin);
      Alert.alert('Success', 'Admin created successfully');
      setCreateAdminModal(false);
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

  const approveUser = async (id: number) => {
    Alert.alert(
      'Approve User',
      'Are you sure you want to approve this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await api.patch(`/admin/users/${id}/approve`);
              Alert.alert('Success', 'User approved successfully');
              setUsers(prev => prev.map(u => 
                u.id === id ? { ...u, status: 'active', is_verified: true } : u
              ));
              await loadStats();
            } catch (err: any) {
              console.log('Approve error:', err);
              Alert.alert('Error', err?.response?.data?.message || 'Failed to approve user');
            }
          },
        },
      ]
    );
  };

  const rejectUser = async (id: number) => {
    Alert.alert(
      'Reject User',
      'Are you sure you want to reject this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.patch(`/admin/users/${id}/reject`);
              Alert.alert('Success', 'User rejected successfully');
              setUsers(prev => prev.filter(u => u.id !== id));
              await loadStats();
            } catch (err: any) {
              console.log('Reject error:', err);
              Alert.alert('Error', err?.response?.data?.message || 'Failed to reject user');
            }
          },
        },
      ]
    );
  };

  const suspendUser = async (id: number) => {
    Alert.alert(
      'Suspend User',
      'Are you sure you want to suspend this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suspend',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.patch(`/admin/users/${id}/suspend`);
              Alert.alert('Success', 'User suspended successfully');
              setUsers(prev => prev.map(u => 
                u.id === id ? { ...u, status: 'suspended' } : u
              ));
              await loadStats();
            } catch (err: any) {
              console.log('Suspend error:', err);
              Alert.alert('Error', err?.response?.data?.message || 'Failed to suspend user');
            }
          },
        },
      ]
    );
  };

  const activateUser = async (id: number) => {
    try {
      await api.patch(`/admin/users/${id}/activate`);
      Alert.alert('Success', 'User activated successfully');
      setUsers(prev => prev.map(u => 
        u.id === id ? { ...u, status: 'active' } : u
      ));
      await loadStats();
    } catch (err: any) {
      console.log('Activate error:', err);
      Alert.alert('Error', err?.response?.data?.message || 'Failed to activate user');
    }
  };

  const deleteUser = async (id: number) => {
    Alert.alert(
      'Delete User',
      'Are you sure you want to delete this user? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/users/${id}`);
              Alert.alert('Success', 'User deleted successfully');
              setUsers(prev => prev.filter(u => u.id !== id));
              await loadStats();
            } catch (err: any) {
              console.log('Delete error:', err);
              Alert.alert('Error', err?.response?.data?.message || 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const updateUserRole = async (id: number, role: string) => {
    try {
      await api.patch(`/admin/users/${id}/role`, { role });
      Alert.alert('Success', 'User role updated successfully');
      setModalVisible(false);
      setUsers(prev => prev.map(u => 
        u.id === id ? { ...u, role } : u
      ));
      await loadUsers();
    } catch (err: any) {
      console.log('Update role error:', err);
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update user role');
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      full_name: user.full_name,
      phone: user.phone,
      email: user.email,
      role: user.role,
    });
    setModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'suspended': return '#f44336';
      case 'deactivated': return '#999';
      case 'approved': return '#2196F3';
      case 'rejected': return '#f44336';
      default: return '#666';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'pending': return 'Pending';
      case 'suspended': return 'Suspended';
      case 'deactivated': return 'Deactivated';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'farmer': return '#2196F3';
      case 'veterinarian': return '#9C27B0';
      case 'super_admin': return '#f44336';
      case 'district_admin': return '#FF9800';
      default: return '#666';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'farmer': return 'Farmer';
      case 'veterinarian': return 'Veterinarian';
      case 'super_admin': return 'Super Admin';
      case 'district_admin': return 'District Admin';
      default: return role;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-RW', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderStatCard = (title: string, value: number, icon: string, color: string) => (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{title}</Text>
    </View>
  );

  const renderUserCard = ({ item }: { item: User }) => {
    return (
      <View style={styles.userCard}>
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.full_name}</Text>
            <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(item.role) + '20' }]}>
              <Text style={[styles.roleText, { color: getRoleBadgeColor(item.role) }]}>
                {getRoleLabel(item.role).toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusLabel(item.status).toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.userDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{item.phone}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="mail-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{item.email}</Text>
          </View>
          {item.district_name && (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.detailText}>{item.district_name}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.detailText}>Joined: {formatDate(item.created_at)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {item.is_verified ? '✅ Verified' : '❌ Not Verified'}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          {(item.status === 'pending' || item.status === 'approved') && (
            <>
              <TouchableOpacity style={styles.approveButton} onPress={() => approveUser(item.id)}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <Text style={styles.buttonText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectButton} onPress={() => rejectUser(item.id)}>
                <Ionicons name="close-circle-outline" size={18} color="#fff" />
                <Text style={styles.buttonText}>Reject</Text>
              </TouchableOpacity>
            </>
          )}
          
          {item.status === 'suspended' && (
            <TouchableOpacity style={styles.activateButton} onPress={() => activateUser(item.id)}>
              <Ionicons name="play-circle-outline" size={18} color="#fff" />
              <Text style={styles.buttonText}>Activate</Text>
            </TouchableOpacity>
          )}
          
          {item.status === 'active' && currentUser?.id !== item.id && (
            <TouchableOpacity style={styles.suspendButton} onPress={() => suspendUser(item.id)}>
              <Ionicons name="pause-circle-outline" size={18} color="#fff" />
              <Text style={styles.buttonText}>Suspend</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(item)}>
            <Ionicons name="create-outline" size={18} color="#2196F3" />
            <Text style={[styles.buttonText, { color: '#2196F3' }]}>Edit</Text>
          </TouchableOpacity>
          
          {currentUser?.id !== item.id && isSuperAdmin && (
            <TouchableOpacity style={styles.deleteButton} onPress={() => deleteUser(item.id)}>
              <Ionicons name="trash-outline" size={18} color="#f44336" />
              <Text style={[styles.buttonText, { color: '#f44336' }]}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D32F2F" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
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
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>
              {isSuperAdmin ? 'Super Admin Dashboard' : 'District Admin Dashboard'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isSuperAdmin 
                ? 'Full system access and management' 
                : 'Manage users in your district'}
            </Text>
            {isSuperAdmin && (
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={16} color="#fff" />
                <Text style={styles.adminBadgeText}>Super Admin</Text>
              </View>
            )}
          </View>
          
          <View style={styles.headerActions}>
            {/* ✅ Admin Management Button - Navigate to Admin Management Screen */}
            {isSuperAdmin && (
              <TouchableOpacity 
                onPress={() => router.push('/(admin)/admin-management')} 
                style={styles.adminManagementButton}
              >
                <Ionicons name="shield-outline" size={24} color="#fff" />
              </TouchableOpacity>
            )}
            
            {/* ✅ Create Admin Button */}
            {isSuperAdmin && (
              <TouchableOpacity 
                onPress={() => setCreateAdminModal(true)} 
                style={styles.createAdminButton}
              >
                <Ionicons name="person-add" size={24} color="#fff" />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsGrid}>
          {renderStatCard('Total Users', stats.total_users || users.length, 'people-outline', '#2196F3')}
          {renderStatCard('Farmers', stats.total_farmers || 0, 'person-outline', '#4CAF50')}
          {renderStatCard('Veterinarians', stats.total_veterinarians || 0, 'medkit-outline', '#9C27B0')}
          {renderStatCard('Pending', stats.pending_approvals || 0, 'time-outline', '#FF9800')}
        </View>

        <Text style={styles.sectionTitle}>All Users ({users.length})</Text>
        {users.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No users found</Text>
            <Text style={styles.emptySubtext}>Pull down to refresh</Text>
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderUserCard}
            scrollEnabled={false}
          />
        )}
      </ScrollView>

      {/* Edit User Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit User</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.full_name}
                  onChangeText={(text) => setEditForm({ ...editForm, full_name: text })}
                  placeholder="Enter full name"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.phone}
                  onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.email}
                  onChangeText={(text) => setEditForm({ ...editForm, email: text })}
                  placeholder="Enter email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Role</Text>
                <View style={styles.roleContainer}>
                  {['farmer', 'veterinarian', 'district_admin'].map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleOption,
                        editForm.role === role && styles.roleOptionActive,
                      ]}
                      onPress={() => setEditForm({ ...editForm, role })}
                    >
                      <Text style={[
                        styles.roleOptionText,
                        editForm.role === role && styles.roleOptionTextActive,
                      ]}>
                        {role.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={styles.updateButton}
                onPress={() => selectedUser && updateUserRole(selectedUser.id, editForm.role)}
              >
                <Text style={styles.updateButtonText}>Update User</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Create Admin Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={createAdminModal}
        onRequestClose={() => setCreateAdminModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Admin</Text>
              <TouchableOpacity onPress={() => setCreateAdminModal(false)}>
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

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Role</Text>
                <View style={styles.roleContainer}>
                  {['district_admin'].map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleOption,
                        newAdmin.role === role && styles.roleOptionActive,
                      ]}
                      onPress={() => setNewAdmin({ ...newAdmin, role })}
                    >
                      <Text style={[
                        styles.roleOptionText,
                        newAdmin.role === role && styles.roleOptionTextActive,
                      ]}>
                        {role.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={styles.updateButton}
                onPress={createAdmin}
              >
                <Text style={styles.updateButtonText}>Create Admin</Text>
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
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
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
    backgroundColor: '#D32F2F',
    padding: 20,
    paddingBottom: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFCDD2',
    marginTop: 5,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    gap: 6,
    alignSelf: 'flex-start',
  },
  adminBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  adminManagementButton: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
  },
  createAdminButton: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
  },
  logoutButton: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderTopWidth: 3,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
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
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    color: '#333',
  },
  userCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  userDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  suspendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  activateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 4,
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
  roleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  roleOption: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  roleOptionActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  roleOptionText: {
    fontSize: 12,
    color: '#666',
  },
  roleOptionTextActive: {
    color: '#fff',
  },
  updateButton: {
    backgroundColor: '#2E7D32',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  updateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});