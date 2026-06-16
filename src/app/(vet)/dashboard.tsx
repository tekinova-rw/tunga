// src/app/(vet)/dashboard.tsx
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
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { api } from '../../api/axios';
import { useAuthStore } from '../../store/auth-store';

type DashboardStats = {
  pending_requests: number;
  active_consultations: number;
  completed_consultations: number;
  total_farmers_served: number;
  today_appointments: number;
  unread_messages: number;
  recent_requests: Array<{
    id: string;
    farmer_name: string;
    farmer_phone: string;
    animal_name: string;
    animal_category: string;
    issue_type: string;
    priority: string;
    description: string;
    created_at: string;
  }>;
};

export default function VetDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    pending_requests: 0,
    active_consultations: 0,
    completed_consultations: 0,
    total_farmers_served: 0,
    today_appointments: 0,
    unread_messages: 0,
    recent_requests: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, token } = useAuthStore();

  const fetchDashboardData = async () => {
    try {
      if (!token) {
        console.log('No token found');
        return;
      }

      console.log('Fetching vet dashboard data...');
      const response = await api.get('/vet/dashboard/stats');
      
      const dashboardData = response.data.data || response.data;
      setStats({
        pending_requests: dashboardData.pending_requests || 0,
        active_consultations: dashboardData.active_consultations || 0,
        completed_consultations: dashboardData.completed_consultations || 0,
        total_farmers_served: dashboardData.total_farmers_served || 0,
        today_appointments: dashboardData.today_appointments || 0,
        unread_messages: dashboardData.unread_messages || 0,
        recent_requests: dashboardData.recent_requests || [],
      });
      
    } catch (error: any) {
      console.log('Dashboard fetch error:', error?.response?.data || error.message);
      
      if (error?.response?.status === 404) {
        // Use mock data for demo
        setStats({
          pending_requests: 3,
          active_consultations: 2,
          completed_consultations: 15,
          total_farmers_served: 8,
          today_appointments: 2,
          unread_messages: 4,
          recent_requests: [
            {
              id: '1',
              farmer_name: 'John Farmer',
              farmer_phone: '0788888888',
              animal_name: 'Bella',
              animal_category: 'Cow',
              issue_type: 'Sickness',
              priority: 'high',
              description: 'Not eating properly and seems weak',
              created_at: new Date().toISOString(),
            },
            {
              id: '2',
              farmer_name: 'Jane Doe',
              farmer_phone: '0788888889',
              animal_name: 'Molly',
              animal_category: 'Goat',
              issue_type: 'Vaccination',
              priority: 'medium',
              description: 'Due for annual vaccination',
              created_at: new Date().toISOString(),
            },
            {
              id: '3',
              farmer_name: 'Peter Smith',
              farmer_phone: '0788888890',
              animal_name: 'Max',
              animal_category: 'Cow',
              issue_type: 'Emergency',
              priority: 'emergency',
              description: 'Difficulty giving birth, need immediate assistance',
              created_at: new Date().toISOString(),
            },
          ],
        });
      } else if (error?.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again');
        router.replace('/(auth)/login');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [token])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleViewRequests = () => {
    router.push({
      pathname: '/(vet)/requests',
    } as any);
  };

  const handleViewAppointments = () => {
    router.push({
      pathname: '/(vet)/appointments',
    } as any);
  };

  const handleMessages = () => {
    router.push({
      pathname: '/(vet)/messages',
    } as any);
  };

  const handleViewProfile = () => {
    router.push({
      pathname: '/(vet)/profile',
    } as any);
  };

  const handleViewRequest = (requestId: string) => {
    router.push({
      pathname: '/(vet)/requests/[id]',
      params: { id: requestId },
    } as any);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'high': return '#f44336';
      case 'emergency': return '#9C27B0';
      default: return '#999';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'low': return 'arrow-down-outline';
      case 'medium': return 'remove-outline';
      case 'high': return 'arrow-up-outline';
      case 'emergency': return 'alert-circle-outline';
      default: return 'help-outline';
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
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
        <View>
          <Text style={styles.greeting}>
            {getGreeting()} 👋
          </Text>
          <Text style={styles.name}>
            Dr. {user?.full_name?.split(' ')[0] || 'Veterinarian'}
          </Text>
          <Text style={styles.subtitle}>
            Veterinary Professional
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={handleViewProfile}
        >
          <Ionicons name="person-circle-outline" size={48} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats Grid - Row 1 */}
      <View style={styles.statsContainer}>
        <View style={[styles.card, styles.cardPending]}>
          <Ionicons name="time-outline" size={28} color="#FF9800" />
          <Text style={styles.cardNumber}>{stats.pending_requests}</Text>
          <Text style={styles.cardLabel}>Pending Requests</Text>
        </View>

        <View style={[styles.card, styles.cardActive]}>
          <Ionicons name="medkit-outline" size={28} color="#2196F3" />
          <Text style={styles.cardNumber}>{stats.active_consultations}</Text>
          <Text style={styles.cardLabel}>Active Cases</Text>
        </View>
      </View>

      {/* Stats Grid - Row 2 */}
      <View style={styles.statsContainer}>
        <View style={[styles.card, styles.cardCompleted]}>
          <Ionicons name="checkmark-done-outline" size={28} color="#4CAF50" />
          <Text style={styles.cardNumber}>{stats.completed_consultations}</Text>
          <Text style={styles.cardLabel}>Completed</Text>
        </View>

        <View style={[styles.card, styles.cardFarmers]}>
          <Ionicons name="people-outline" size={28} color="#9C27B0" />
          <Text style={styles.cardNumber}>{stats.total_farmers_served}</Text>
          <Text style={styles.cardLabel}>Farmers Served</Text>
        </View>
      </View>

      {/* Stats Grid - Row 3 */}
      <View style={styles.statsContainer}>
        <View style={[styles.card, styles.cardAppointments]}>
          <Ionicons name="calendar-outline" size={28} color="#E91E63" />
          <Text style={styles.cardNumber}>{stats.today_appointments}</Text>
          <Text style={styles.cardLabel}>Today's Appointments</Text>
        </View>

        <View style={[styles.card, styles.cardMessages]}>
          <Ionicons name="chatbubbles-outline" size={28} color="#795548" />
          <Text style={styles.cardNumber}>{stats.unread_messages}</Text>
          <Text style={styles.cardLabel}>Unread Messages</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.actionCard} onPress={handleViewRequests}>
          <View style={styles.actionIcon}>
            <Ionicons name="document-text-outline" size={28} color="#2196F3" />
          </View>
          <Text style={styles.actionText}>View Requests</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={handleViewAppointments}>
          <View style={styles.actionIcon}>
            <Ionicons name="calendar-outline" size={28} color="#E91E63" />
          </View>
          <Text style={styles.actionText}>Appointments</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={handleMessages}>
          <View style={styles.actionIcon}>
            <Ionicons name="chatbubbles-outline" size={28} color="#795548" />
          </View>
          <Text style={styles.actionText}>Messages</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard}>
          <View style={styles.actionIcon}>
            <Ionicons name="bar-chart-outline" size={28} color="#FF9800" />
          </View>
          <Text style={styles.actionText}>Reports</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Requests */}
      {stats.recent_requests.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Requests</Text>
            <TouchableOpacity onPress={handleViewRequests}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.requestsContainer}>
            {stats.recent_requests.map((request) => (
              <TouchableOpacity
                key={request.id}
                style={styles.requestItem}
                onPress={() => handleViewRequest(request.id)}
                activeOpacity={0.7}
              >
                <View style={styles.requestHeader}>
                  <View style={styles.requestInfo}>
                    <View style={styles.farmerInfo}>
                      <Ionicons name="person-outline" size={16} color="#666" />
                      <Text style={styles.farmerName}>{request.farmer_name}</Text>
                    </View>
                    <View style={styles.animalInfo}>
                      <Ionicons name="paw-outline" size={14} color="#999" />
                      <Text style={styles.animalName}>
                        {request.animal_name} ({request.animal_category})
                      </Text>
                    </View>
                    <Text style={styles.issueType}>{request.issue_type}</Text>
                  </View>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(request.priority) + '20' }]}>
                    <Ionicons name={getPriorityIcon(request.priority)} size={12} color={getPriorityColor(request.priority)} />
                    <Text style={[styles.priorityText, { color: getPriorityColor(request.priority) }]}>
                      {request.priority.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.requestTime}>
                  {new Date(request.created_at).toLocaleDateString('en-RW', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Availability Status */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Ionicons name="radio-button-on" size={20} color="#4CAF50" />
          <Text style={styles.statusTitle}>Available for Consultations</Text>
        </View>
        <Text style={styles.statusText}>
          You are currently accepting new requests. Farmers can reach out for veterinary assistance.
        </Text>
        <TouchableOpacity style={styles.statusButton}>
          <Text style={styles.statusButtonText}>Update Availability</Text>
        </TouchableOpacity>
      </View>

      {/* Tip of the Day */}
      <View style={styles.tipContainer}>
        <Ionicons name="bulb-outline" size={24} color="#FF9800" />
        <View style={styles.tipContent}>
          <Text style={styles.tipTitle}>Pro Tip</Text>
          <Text style={styles.tipText}>
            Responding quickly to emergency requests can save animals' lives. Priority requests should be addressed within 30 minutes.
          </Text>
        </View>
      </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#2196F3',
    padding: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  greeting: {
    fontSize: 14,
    color: '#E3F2FD',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#E3F2FD',
    marginTop: 2,
  },
  profileButton: {
    padding: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginTop: -20,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  cardPending: {
    borderTopWidth: 3,
    borderTopColor: '#FF9800',
  },
  cardActive: {
    borderTopWidth: 3,
    borderTopColor: '#2196F3',
  },
  cardCompleted: {
    borderTopWidth: 3,
    borderTopColor: '#4CAF50',
  },
  cardFarmers: {
    borderTopWidth: 3,
    borderTopColor: '#9C27B0',
  },
  cardAppointments: {
    borderTopWidth: 3,
    borderTopColor: '#E91E63',
  },
  cardMessages: {
    borderTopWidth: 3,
    borderTopColor: '#795548',
  },
  cardNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 6,
  },
  cardLabel: {
    marginTop: 4,
    color: '#666',
    fontSize: 11,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  viewAllText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginHorizontal: 16,
  },
  actionCard: {
    width: '47%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  requestsContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 1,
  },
  requestItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  requestInfo: {
    flex: 1,
    marginRight: 10,
  },
  farmerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  farmerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  animalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  animalName: {
    fontSize: 13,
    color: '#666',
  },
  issueType: {
    fontSize: 12,
    color: '#999',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  requestTime: {
    fontSize: 11,
    color: '#999',
  },
  statusCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 12,
  },
  statusButton: {
    backgroundColor: '#E3F2FD',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusButtonText: {
    fontSize: 13,
    color: '#2196F3',
    fontWeight: '500',
  },
  tipContainer: {
    backgroundColor: '#FFF8E1',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
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