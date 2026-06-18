// src/app/(farmer)/animals/add.tsx
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { api } from '../../../api/axios';
import { useAuthStore } from '../../../store/auth-store';

type AnimalCategory = 'Cow' | 'Goat' | 'Sheep' | 'Pig' | 'Chicken' | 'Rabbit' | 'Horse' | 'Other';

const CATEGORIES: AnimalCategory[] = ['Cow', 'Goat', 'Sheep', 'Pig', 'Chicken', 'Rabbit', 'Horse', 'Other'];

const HEALTH_STATUSES = ['Healthy', 'Sick', 'Recovering', 'Under Treatment', 'Pregnant', 'Critical'];

export default function AddAnimalScreen() {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AnimalCategory>('Cow');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [healthStatus, setHealthStatus] = useState('Healthy');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showHealthStatuses, setShowHealthStatuses] = useState(false);
  
  const { token } = useAuthStore();

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter animal name');
      return false;
    }
    
    if (name.trim().length < 2) {
      Alert.alert('Validation Error', 'Animal name must be at least 2 characters');
      return false;
    }
    
    if (age && (isNaN(Number(age)) || Number(age) < 0)) {
      Alert.alert('Validation Error', 'Please enter a valid age');
      return false;
    }
    
    if (weight && (isNaN(Number(weight)) || Number(weight) < 0)) {
      Alert.alert('Validation Error', 'Please enter a valid weight');
      return false;
    }
    
    return true;
  };

  const saveAnimal = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      if (!token) {
        Alert.alert('Error', 'You must be logged in');
        return;
      }
      
      const payload = {
        name: name.trim(),
        category,
        breed: breed.trim() || null,
        age: age ? parseInt(age) : null,
        weight: weight ? parseFloat(weight) : null,
        health_status: healthStatus.toLowerCase(),
        notes: notes.trim() || null,
      };
      
      console.log('Saving animal:', payload);
      
      const response = await api.post('/animals', payload);
      
      console.log('Save response:', response.data);
      
      Alert.alert(
        'Success',
        `${name} has been added to your farm! 🎉`,
        [
          {
            text: 'View Animals',
            onPress: () => {
              // ✅ FIX: Use router.back() or navigate to the animals index
              router.back();
            },
          },
          {
            text: 'Add Another',
            onPress: () => {
              // Reset form
              setName('');
              setCategory('Cow');
              setBreed('');
              setAge('');
              setWeight('');
              setHealthStatus('Healthy');
              setNotes('');
            },
            style: 'cancel',
          },
        ]
      );
      
    } catch (error: any) {
      console.log('Save error:', error?.response?.data || error.message);
      
      if (error?.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again');
        router.replace('/(auth)/login');
      } else {
        Alert.alert(
          'Error',
          error?.response?.data?.message || 'Failed to save animal. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add New Animal</Text>
          <Text style={styles.headerSubtitle}>Enter your animal's details</Text>
        </View>

        {/* Animal Name */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Animal Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            placeholder="e.g., Bella, Luna, Max"
            style={styles.input}
            value={name}
            onChangeText={setName}
            maxLength={50}
          />
        </View>

        {/* Category Dropdown */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Category <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowCategories(!showCategories)}
          >
            <Text style={styles.dropdownText}>{category}</Text>
            <Ionicons name={showCategories ? 'chevron-up' : 'chevron-down'} size={20} color="#666" />
          </TouchableOpacity>
          {showCategories && (
            <View style={styles.dropdownList}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.dropdownItem,
                    category === cat && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    setCategory(cat);
                    setShowCategories(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    category === cat && styles.dropdownItemTextActive,
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Breed */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Breed (Optional)</Text>
          <TextInput
            placeholder="e.g., Holstein, Saanen, Boer"
            style={styles.input}
            value={breed}
            onChangeText={setBreed}
            maxLength={50}
          />
        </View>

        {/* Age and Weight Row */}
        <View style={styles.row}>
          <View style={[styles.fieldContainer, styles.halfField]}>
            <Text style={styles.label}>Age (Years)</Text>
            <TextInput
              placeholder="e.g., 2"
              style={styles.input}
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.fieldContainer, styles.halfField]}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              placeholder="e.g., 250"
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Health Status Dropdown */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Health Status</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowHealthStatuses(!showHealthStatuses)}
          >
            <Text style={styles.dropdownText}>{healthStatus}</Text>
            <Ionicons name={showHealthStatuses ? 'chevron-up' : 'chevron-down'} size={20} color="#666" />
          </TouchableOpacity>
          {showHealthStatuses && (
            <View style={styles.dropdownList}>
              {HEALTH_STATUSES.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.dropdownItem,
                    healthStatus === status && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    setHealthStatus(status);
                    setShowHealthStatuses(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    healthStatus === status && styles.dropdownItemTextActive,
                  ]}>
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Notes */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            placeholder="Any additional information about the animal..."
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={goBack}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveAnimal}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Save Animal</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2E7D32',
    padding: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
  fieldContainer: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#ff4444',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginTop: 5,
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemActive: {
    backgroundColor: '#E8F5E9',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownItemTextActive: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 12,
  },
  halfField: {
    flex: 1,
    marginHorizontal: 0,
  },
  buttonContainer: {
    flexDirection: 'row',
    margin: 16,
    gap: 12,
    marginBottom: 30,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#2E7D32',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});