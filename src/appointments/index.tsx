// ============================================================
// FILE: src/app/(farmer)/appointments/index.tsx
// DESCRIPTION: Appointments list screen for farmers
// ============================================================

import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';

// Define Appointment type
interface Appointment {
  id: number;
  animal_id: number;
  animal_name?: string;
  veterinarian_id: number;
  veterinarian_name?: string;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  type: 'checkup' | 'vaccination' | 'treatment' | 'surgery' | 'emergency' | 'follow-up';
  notes?: string;
  created_at?: string;
}

export default function AppointmentsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch appointments on mount
  useEffect(() => {
    fetchAppointments();
  }, []);

  // TODO: Replace with actual API call
  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // const response = await api.get('/farmer/appointments');
      // setAppointments(response.data);
      
      // Mock data for now
      const mockAppointments: Appointment[] = [
        {
          id: 1,
          animal_id: 1,
          animal_name: 'Bella',
          veterinarian_id: 1,
          veterinarian_name: 'Dr. Mugisha',
          appointment_date: '2026-06-25',
          appointment_time: '10:00',
          status: 'confirmed',
          type: 'checkup',
          notes: 'Regular health checkup',
        },
        {
          id: 2,
          animal_id: 2,
          animal_name: 'Max',
          veterinarian_id: 2,
          veterinarian_name: 'Dr. Uwimana',
          appointment_date: '2026-06-28',
          appointment_time: '14:30',
          status: 'pending',
          type: 'vaccination',
          notes: 'Annual vaccination',
        },
        {
          id: 3,
          animal_id: 3,
          animal_name: 'Luna',
          veterinarian_id: 1,
          veterinarian_name: 'Dr. Mugisha',
          appointment_date: '2026-06-20',
          appointment_time: '09:00',
          status: 'completed',
          type: 'treatment',
          notes: 'Follow-up treatment',
        },
      ];
      
      setTimeout(() => {
        setAppointments(mockAppointments);
        setIsLoading(false);
      }, 500);
      
    } catch (error: any) {
      console.log('❌ Failed to fetch appointments:', error);
      setError(error.message || 'Failed to load appointments');
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#FF9800',
      confirmed: '#2196F3',
      completed: '#4CAF50',
      cancelled: '#f44336',
      rescheduled: '#9C27B0',
    };
    return colors[status] || '#999';
  };

  // Get status icon - FIXED: Return as any to avoid TypeScript error
  const getStatusIcon = (status: string): any => {
    const icons: Record<string, any> = {
      pending: 'time-outline',
      confirmed: 'checkmark-circle-outline',
      completed: 'checkmark-done-circle-outline',
      cancelled: 'close-circle-outline',
      rescheduled: 'refresh-outline',
    };
    return icons[status] || 'help-circle-outline';
  };

  // Get type emoji
  const getTypeEmoji = (type: string) => {
    const emojis: Record<string, string> = {
      checkup: '🩺',
      vaccination: '💉',
      treatment: '💊',
      surgery: '🔬',
      emergency: '🚨',
      'follow-up': '📋',
    };
    return emojis[type] || '📅';
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Loading state
  if (isLoading && appointments.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading appointments...</Text>
      </View>
    );
  }

  // Error state
  if (error && appointments.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="calendar-outline" size={60} color="#ccc" />
        <Text style={styles.errorText}>Failed to load appointments</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchAppointments}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (appointments.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="calendar-outline" size={60} color="#ccc" />
        <Text style={styles.emptyText}>No appointments</Text>
        <Text style={styles.emptySubtext}>
          Book your first veterinary appointment
        </Text>
        <TouchableOpacity 
          style={styles.bookButton}
          onPress={() => router.push('/(farmer)/appointments/create' as any)}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.bookButtonText}>Book Appointment</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render appointment card
  const renderAppointment = ({ item }: { item: Appointment }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        // Navigate to appointment details
        router.push({
          pathname: '/(farmer)/appointments/[id]',
          params: { id: item.id }
        } as any);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.typeContainer}>
          <Text style={styles.typeEmoji}>{getTypeEmoji(item.type)}</Text>
          <Text style={styles.typeText}>{item.type?.toUpperCase() || 'APPOINTMENT'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Ionicons name={getStatusIcon(item.status)} size={14} color={getStatusColor(item.status)} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status?.toUpperCase() || 'UNKNOWN'}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.animalInfo}>
          <Text style={styles.animalName}>{item.animal_name || 'Unknown Animal'}</Text>
          <Text style={styles.vetName}>
            <Ionicons name="medkit-outline" size={14} color="#666" />
            {' '}{item.veterinarian_name || 'Veterinarian'}
          </Text>
        </View>

        <View style={styles.dateTimeContainer}>
          <View style={styles.dateTimeItem}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.dateTimeText}>{formatDate(item.appointment_date)}</Text>
          </View>
          <View style={styles.dateTimeItem}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.dateTimeText}>{item.appointment_time}</Text>
          </View>
        </View>

        {item.notes && (
          <Text style={styles.notesText} numberOfLines={1}>
            📝 {item.notes}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={appointments}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderAppointment}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#2E7D32']}
          tintColor="#2E7D32"
        />
      }
      ListHeaderComponent={
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Appointments</Text>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => router.push('/(farmer)/appointments/create' as any)}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.headerButtonText}>New</Text>
          </TouchableOpacity>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#2E7D32',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  bookButton: {
    marginTop: 20,
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  headerButton: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeEmoji: {
    fontSize: 16,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardBody: {
    gap: 8,
  },
  animalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  animalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B5E20',
  },
  vetName: {
    fontSize: 13,
    color: '#666',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateTimeText: {
    fontSize: 13,
    color: '#666',
  },
  notesText: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
});