// ============================================================
// FILE: src/app/(farmer)/dashboard.tsx
// DESCRIPTION: Farmer dashboard screen
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { api } from '../../api/axios';
import { useAuthStore } from '../../store/auth-store';

type DashboardStats = {
  total_animals: number;
  pending_requests: number;
  active_appointments: number;
  unread_notifications: number;
  recent_activities: Array<{
    id: string;
    type: string;
    message: string;
    created_at: string;
  }>;
};

export default function FarmerDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    total_animals: 0,
    pending_requests: 0,
    active_appointments: 0,
    unread_notifications: 0,
    recent_activities: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, token, logout } = useAuthStore();

  // Check session validity
  const checkSession = useCallback(() => {
    if (!token || !user) {
      console.log('No session found, redirecting to login');
      router.replace('/(auth)/login');
      return false;
    }
    return true;
  }, [token, user]);

  const fetchDashboardData = async () => {
    try {
      if (!checkSession()) return;

      console.log('📊 Fetching dashboard data...');
      
      // ✅ Use the working endpoint
      const response = await api.get('/farmer/dashboard');
      const dashboardData = response.data.data || response.data;
      
      setStats({
        total_animals: dashboardData.total_animals || 0,
        pending_requests: dashboardData.pending_requests || 0,
        active_appointments: dashboardData.active_appointments || 0,
        unread_notifications: dashboardData.unread_notifications || 0,
        recent_activities: dashboardData.recent_activities || [],
      });
      
    } catch (error: any) {
      console.log('❌ Dashboard fetch error:', error?.response?.data || error.message);
      
      // Handle 401 - Token expired
      if (error?.response?.status === 401) {
        console.log('Session invalid');
        await logout();
        Alert.alert('Session Expired', 'Please login again.');
        router.replace('/(auth)/login');
        return;
      }
      
      // Handle 403 - Forbidden
      if (error?.response?.status === 403) {
        console.log('User account is no longer active');
        await logout();
        Alert.alert('Account Issue', 'Your account is no longer active. Please contact support.');
        router.replace('/(auth)/login');
        return;
      }
      
      // Use mock data as fallback
      console.log('📊 Using mock data');
      setStats({
        total_animals: 2,
        pending_requests: 1,
        active_appointments: 0,
        unread_notifications: 2,
        recent_activities: [
          {
            id: '1',
            type: 'animal_added',
            message: 'Added new animal: Bella',
            created_at: new Date().toISOString(),
          },
          {
            id: '2',
            type: 'request_submitted',
            message: 'Veterinary request submitted',
            created_at: new Date().toISOString(),
          },
        ],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Check session on mount
  useEffect(() => {
    checkSession();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (checkSession()) {
        fetchDashboardData();
      }
    }, [token])
  );

  const onRefresh = () => {
    if (checkSession()) {
      setRefreshing(true);
      fetchDashboardData();
    }
  };

  // Navigate with session check
  const navigateWithAuth = (path: string) => {
    if (checkSession()) {
      router.push(path as any);
    }
  };

  // Navigation handlers
  const handleAddAnimal = () => {
    navigateWithAuth('/(farmer)/animals/add');
  };

  const handleViewAnimals = () => {
    navigateWithAuth('/(farmer)/animals');
  };

  const handleRequestVet = () => {
    navigateWithAuth('/(farmer)/requests');
  };

  const handleAppointments = () => {
    navigateWithAuth('/(farmer)/appointments');
  };

  const handleProfile = () => {
    navigateWithAuth('/(farmer)/profile');
  };

  // Chat hub - unified chat entry point
  const handleChat = () => {
    navigateWithAuth('/(farmer)/chat');
  };

  const handleEmergencySOS = () => {
    if (!checkSession()) return;
    
    Alert.alert(
      'Emergency SOS',
      'This will send an emergency alert to nearby veterinarians. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post('/farmer/emergency/sos');
              Alert.alert('SOS Sent', 'Emergency alert has been sent to nearby veterinarians');
            } catch (error: any) {
              if (error?.response?.status === 401 || error?.response?.status === 403) {
                await logout();
                Alert.alert('Session Expired', 'Please login again.');
                router.replace('/(auth)/login');
              } else {
                Alert.alert('Error', 'Failed to send SOS. Please call emergency services.');
              }
            }
          },
        },
      ]
    );
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#2E7D32']}
          tintColor="#2E7D32"
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {getGreeting()} 👋
          </Text>
          <Text style={styles.name}>
            {user?.full_name?.split(' ')[0] || 'Farmer'}
          </Text>
          <Text style={styles.farmInfo}>
            🏠 {user?.district_id ? 'District Farm' : 'My Farm'}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={handleProfile}
        >
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {user?.full_name?.charAt(0) || 'F'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsContainer}>
        <TouchableOpacity style={styles.card} onPress={handleViewAnimals}>
          <View style={[styles.cardIcon, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="paw-outline" size={24} color="#2E7D32" />
          </View>
          <Text style={styles.cardNumber}>{stats.total_animals}</Text>
          <Text style={styles.cardLabel}>Animals</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={handleRequestVet}>
          <View style={[styles.cardIcon, { backgroundColor: '#FFF3E0' }]}>
            <Ionicons name="chatbubble-outline" size={24} color="#FF9800" />
          </View>
          <Text style={styles.cardNumber}>{stats.pending_requests}</Text>
          <Text style={styles.cardLabel}>Requests</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <TouchableOpacity style={styles.card} onPress={handleAppointments}>
          <View style={[styles.cardIcon, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="calendar-outline" size={24} color="#2196F3" />
          </View>
          <Text style={styles.cardNumber}>{stats.active_appointments}</Text>
          <Text style={styles.cardLabel}>Appointments</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={handleChat}>
          <View style={[styles.cardIcon, { backgroundColor: '#F3E5F5' }]}>
            <Ionicons name="chatbubbles-outline" size={24} color="#9C27B0" />
          </View>
          <Text style={styles.cardNumber}>{stats.unread_notifications}</Text>
          <Text style={styles.cardLabel}>Messages</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions - Organized by category */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <View style={styles.actionsGrid}>
        {/* Farm Management */}
        <TouchableOpacity style={styles.actionCard} onPress={handleAddAnimal}>
          <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
            <Text style={styles.actionEmoji}>🐄</Text>
          </View>
          <Text style={styles.actionText}>Add Animal</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={handleViewAnimals}>
          <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
            <Text style={styles.actionEmoji}>🐾</Text>
          </View>
          <Text style={styles.actionText}>My Animals</Text>
        </TouchableOpacity>

        {/* Veterinary Services */}
        <TouchableOpacity style={styles.actionCard} onPress={handleRequestVet}>
          <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
            <Text style={styles.actionEmoji}>🩺</Text>
          </View>
          <Text style={styles.actionText}>Request Vet</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={handleAppointments}>
          <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
            <Text style={styles.actionEmoji}>📅</Text>
          </View>
          <Text style={styles.actionText}>Appointments</Text>
        </TouchableOpacity>

        {/* Communication */}
        <TouchableOpacity style={[styles.actionCard, styles.actionCardFull]} onPress={handleChat}>
          <View style={[styles.actionIcon, { backgroundColor: '#F3E5F5' }]}>
            <Text style={styles.actionEmoji}>💬</Text>
          </View>
          <Text style={styles.actionText}>Chat</Text>
        </TouchableOpacity>

        {/* Profile */}
        <TouchableOpacity style={[styles.actionCard, styles.actionCardFull]} onPress={handleProfile}>
          <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="person-outline" size={24} color="#2E7D32" />
          </View>
          <Text style={styles.actionText}>My Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Activity */}
      {stats.recent_activities.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityContainer}>
            {stats.recent_activities.slice(0, 3).map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Ionicons 
                    name={activity.type === 'animal_added' ? 'paw' : 'chatbox'} 
                    size={20} 
                    color="#2E7D32" 
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityMessage}>{activity.message}</Text>
                  <Text style={styles.activityTime}>
                    {new Date(activity.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Emergency SOS Button */}
      <TouchableOpacity style={styles.sosButton} onPress={handleEmergencySOS}>
        <Ionicons name="alert-circle" size={24} color="#fff" />
        <Text style={styles.sosText}>Emergency SOS</Text>
      </TouchableOpacity>

      {/* Tip of the Day */}
      <View style={styles.tipContainer}>
        <Ionicons name="bulb-outline" size={24} color="#FF9800" />
        <View style={styles.tipContent}>
          <Text style={styles.tipTitle}>Tip of the Day</Text>
          <Text style={styles.tipText}>
            Regular health checkups can prevent major diseases in your livestock.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FAF5',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FAF5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 12,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: '#666',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginTop: 2,
  },
  farmInfo: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  profileButton: {
    padding: 4,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  cardLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 12,
    color: '#333',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionCard: {
    width: '30%',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  actionCardFull: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionEmoji: {
    fontSize: 24,
  },
  actionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  sosButton: {
    backgroundColor: '#D32F2F',
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    elevation: 3,
  },
  sosText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  activityContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 11,
    color: '#999',
  },
  tipContainer: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
    alignItems: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF9800',
    marginBottom: 2,
  },
  tipText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});