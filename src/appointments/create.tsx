// ============================================================
// FILE: src/app/(farmer)/appointments/create.tsx
// DESCRIPTION: Create appointment screen for farmers
// ============================================================

import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface FormData {
  animal_id: string;
  veterinarian_id: string;
  date: Date;
  time: Date;
  type: string;
  notes: string;
}

export default function CreateAppointmentScreen() {
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    animal_id: '',
    veterinarian_id: '',
    date: new Date(),
    time: new Date(),
    type: 'checkup',
    notes: '',
  });

  const appointmentTypes = [
    { value: 'checkup', label: '🩺 Checkup' },
    { value: 'vaccination', label: '💉 Vaccination' },
    { value: 'treatment', label: '💊 Treatment' },
    { value: 'surgery', label: '🔬 Surgery' },
    { value: 'emergency', label: '🚨 Emergency' },
    { value: 'follow-up', label: '📋 Follow-up' },
  ];

  // Mock animals and veterinarians (replace with API data)
  const animals = [
    { id: 1, name: 'Bella' },
    { id: 2, name: 'Max' },
    { id: 3, name: 'Luna' },
  ];

  const veterinarians = [
    { id: 1, name: 'Dr. Mugisha' },
    { id: 2, name: 'Dr. Uwimana' },
  ];

  const handleSubmit = async () => {
    // Validate form
    if (!formData.animal_id) {
      Alert.alert('Error', 'Please select an animal');
      return;
    }
    if (!formData.veterinarian_id) {
      Alert.alert('Error', 'Please select a veterinarian');
      return;
    }

    setLoading(true);

    try {
      // TODO: Replace with actual API call
      // const appointmentData = {
      //   animal_id: parseInt(formData.animal_id),
      //   veterinarian_id: parseInt(formData.veterinarian_id),
      //   appointment_date: formData.date.toISOString().split('T')[0],
      //   appointment_time: formData.time.toTimeString().slice(0, 5),
      //   type: formData.type,
      //   notes: formData.notes,
      // };
      // await api.post('/farmer/appointments', appointmentData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Success',
        'Appointment booked successfully!',
        [
          {
            text: 'View Appointments',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({ ...formData, date: selectedDate });
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setFormData({ ...formData, time: selectedTime });
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Animal Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Select Animal</Text>
          <View style={styles.optionsContainer}>
            {animals.map((animal) => (
              <TouchableOpacity
                key={animal.id}
                style={[
                  styles.optionButton,
                  formData.animal_id === animal.id.toString() && styles.optionButtonSelected,
                ]}
                onPress={() => setFormData({ ...formData, animal_id: animal.id.toString() })}
              >
                <Text
                  style={[
                    styles.optionText,
                    formData.animal_id === animal.id.toString() && styles.optionTextSelected,
                  ]}
                >
                  🐾 {animal.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Veterinarian Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Select Veterinarian</Text>
          <View style={styles.optionsContainer}>
            {veterinarians.map((vet) => (
              <TouchableOpacity
                key={vet.id}
                style={[
                  styles.optionButton,
                  formData.veterinarian_id === vet.id.toString() && styles.optionButtonSelected,
                ]}
                onPress={() => setFormData({ ...formData, veterinarian_id: vet.id.toString() })}
              >
                <Text
                  style={[
                    styles.optionText,
                    formData.veterinarian_id === vet.id.toString() && styles.optionTextSelected,
                  ]}
                >
                  👨‍⚕️ {vet.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.label}>Date & Time</Text>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={styles.dateTimeText}>{formatDate(formData.date)}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.dateTimeText}>{formatTime(formData.time)}</Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={formData.date}
              mode="date"
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={formData.time}
              mode="time"
              onChange={onTimeChange}
            />
          )}
        </View>

        {/* Appointment Type */}
        <View style={styles.section}>
          <Text style={styles.label}>Appointment Type</Text>
          <View style={styles.optionsContainer}>
            {appointmentTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.optionButton,
                  formData.type === type.value && styles.optionButtonSelected,
                ]}
                onPress={() => setFormData({ ...formData, type: type.value })}
              >
                <Text
                  style={[
                    styles.optionText,
                    formData.type === type.value && styles.optionTextSelected,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Add any additional notes..."
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-outline" size={24} color="#fff" />
              <Text style={styles.submitButtonText}>Book Appointment</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  optionButtonSelected: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  optionTextSelected: {
    color: '#fff',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  dateTimeText: {
    fontSize: 14,
    color: '#333',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    minHeight: 100,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2E7D32',
    padding: 16,
    borderRadius: 10,
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});