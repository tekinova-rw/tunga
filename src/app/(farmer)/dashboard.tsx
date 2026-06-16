// src/app/(farmer)/dashboard.tsx
import { useState, useCallback, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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
  const { user, token, logout, clearSession } = useAuthStore();

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
      // Check session first
      if (!checkSession()) {
        return;
      }

      console.log('Fetching dashboard data...');
      
      // Fetch dashboard stats
      const statsResponse = await api.get('/farmer/dashboard/stats');
      const dashboardData = statsResponse.data.data || statsResponse.data;
      
      setStats({
        total_animals: dashboardData.total_animals || 0,
        pending_requests: dashboardData.pending_requests || 0,
        active_appointments: dashboardData.active_appointments || 0,
        unread_notifications: dashboardData.unread_notifications || 0,
        recent_activities: dashboardData.recent_activities || [],
      });
      
    } catch (error: any) {
      console.log('Dashboard fetch error:', error?.response?.data || error.message);
      
      // Handle 401 - Token expired or user deleted
      if (error?.response?.status === 401) {
        console.log('Session invalid or user deleted');
        await logout();
        Alert.alert('Session Expired', 'Your session has expired. Please login again.');
        router.replace('/(auth)/login');
        return;
      }
      
      // Handle 403 - Forbidden (user deleted or suspended)
      if (error?.response?.status === 403) {
        console.log('User account is no longer active');
        await logout();
        Alert.alert('Account Issue', 'Your account is no longer active. Please contact support.');
        router.replace('/(auth)/login');
        return;
      }
      
      // Handle 404 - Endpoint not found (use mock data for demo)
      if (error?.response?.status === 404) {
        // Use mock data for demo
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
      }
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

  const handleAddAnimal = () => {
    navigateWithAuth('/(farmer)/animals/add');
  };

  const handleRequestVet = () => {
    navigateWithAuth('/(farmer)/requests');
  };

  const handleAppointments = () => {
    if (checkSession()) {
      router.push({
        pathname: '/(farmer)/appointments',
      } as any);
    }
  };

  const handleMessages = () => {
    if (checkSession()) {
      router.push({
        pathname: '/(farmer)/messages',
      } as any);
    }
  };

  const handleProfile = () => {
    if (checkSession()) {
      router.push({
        pathname: '/(farmer)/profile',
      } as any);
    }
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
              // Handle 401/403 on SOS request too
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

  // If no user, don't render (will redirect)
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
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={handleProfile}
        >
          <Ionicons name="person-circle-outline" size={44} color="#2E7D32" />
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsContainer}>
        <View style={styles.card}>
          <Ionicons name="paw-outline" size={28} color="#2E7D32" />
          <Text style={styles.cardNumber}>{stats.total_animals}</Text>
          <Text style={styles.cardLabel}>Animals</Text>
        </View>

        <View style={styles.card}>
          <Ionicons name="chatbubble-outline" size={28} color="#FF9800" />
          <Text style={styles.cardNumber}>{stats.pending_requests}</Text>
          <Text style={styles.cardLabel}>Requests</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.card}>
          <Ionicons name="calendar-outline" size={28} color="#2196F3" />
          <Text style={styles.cardNumber}>{stats.active_appointments}</Text>
          <Text style={styles.cardLabel}>Appointments</Text>
        </View>

        <View style={styles.card}>
          <Ionicons name="notifications-outline" size={28} color="#9C27B0" />
          <Text style={styles.cardNumber}>{stats.unread_notifications}</Text>
          <Text style={styles.cardLabel}>Notifications</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.actionCard} onPress={handleAddAnimal}>
          <Text style={styles.actionEmoji}>🐄</Text>
          <Text style={styles.actionText}>Add Animal</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={handleRequestVet}>
          <Text style={styles.actionEmoji}>🩺</Text>
          <Text style={styles.actionText}>Request Vet</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={handleAppointments}>
          <Text style={styles.actionEmoji}>📅</Text>
          <Text style={styles.actionText}>Appointments</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={handleMessages}>
          <Text style={styles.actionEmoji}>💬</Text>
          <Text style={styles.actionText}>Messages</Text>
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
    padding: 20,
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
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  profileButton: {
    padding: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 8,
  },
  cardLabel: {
    marginTop: 4,
    color: '#666',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 25,
    marginBottom: 15,
    color: '#333',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  actionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  sosButton: {
    backgroundColor: '#D32F2F',
    padding: 16,
    borderRadius: 16,
    marginTop: 30,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    elevation: 3,
  },
  sosText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  activityContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 11,
    color: '#999',
  },
  tipContainer: {
    backgroundColor: '#FFF8E1',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9800',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});