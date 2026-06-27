// ============================================================
// FILE: src/app/(farmer)/appointments/[id].tsx
// DESCRIPTION: Appointment details screen
// ============================================================

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

export default function AppointmentDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);

  // Mock appointment data (replace with API call)
  const appointment = {
    id: id,
    animal_name: 'Bella',
    veterinarian_name: 'Dr. Mugisha',
    date: '2026-06-25',
    time: '10:00',
    status: 'confirmed',
    type: 'checkup',
    notes: 'Regular health checkup for Bella',
    location: 'Kigali Veterinary Clinic',
  };

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

  const handleCancel = () => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: () => {
            // Handle cancellation
            Alert.alert('Cancelled', 'Appointment has been cancelled');
            router.back();
          }
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View>
            <Text style={styles.animalName}>{appointment.animal_name}</Text>
            <Text style={styles.vetName}>{appointment.veterinarian_name}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(appointment.status) }]}>
              {appointment.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={20} color="#666" />
          <Text style={styles.detailText}>{appointment.date}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={20} color="#666" />
          <Text style={styles.detailText}>{appointment.time}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="medkit-outline" size={20} color="#666" />
          <Text style={styles.detailText}>{appointment.type.toUpperCase()}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={20} color="#666" />
          <Text style={styles.detailText}>{appointment.location}</Text>
        </View>

        {appointment.notes && (
          <>
            <View style={styles.divider} />
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>{appointment.notes}</Text>
            </View>
          </>
        )}

        {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Ionicons name="close-circle-outline" size={20} color="#f44336" />
            <Text style={styles.cancelButtonText}>Cancel Appointment</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  animalName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 4,
  },
  vetName: {
    fontSize: 16,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
  },
  notesContainer: {
    marginTop: 4,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f44336',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#f44336',
    fontWeight: '600',
  },
});