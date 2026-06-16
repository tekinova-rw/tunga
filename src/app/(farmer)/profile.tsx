// src/app/(farmer)/profile.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { api } from '../../api/axios';
import { useAuthStore } from '../../store/auth-store';

type UserProfile = {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  role: string;
  district_id: number;
  province: string | null;
  address: string | null;
  profile_image: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at?: string;
};

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: '',
  });
  
  const { user, token, logout } = useAuthStore();

  const fetchProfile = async () => {
    try {
      if (!token) {
        console.log('No token found');
        return;
      }

      console.log('📥 Fetching profile...');
      const response = await api.get('/auth/profile');
      
      console.log('📥 Profile response:', response.data);
      
      const profileData = response.data.data || response.data;
      setProfile(profileData);
      
      // Initialize edit form with safe fallbacks
      setEditForm({
        full_name: profileData.full_name || '',
        phone: profileData.phone || '',
        email: profileData.email || '',
        address: profileData.address || '',
      });
      
    } catch (error: any) {
      console.log('❌ Profile fetch error:', error?.response?.data || error.message);
      
      if (error?.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again');
        router.replace('/(auth)/login');
      } else {
        Alert.alert('Error', 'Failed to load profile');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [token])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const handleUpdateProfile = async () => {
    if (!editForm.full_name.trim()) {
      Alert.alert('Error', 'Full name is required');
      return;
    }
    
    if (!editForm.phone.trim()) {
      Alert.alert('Error', 'Phone number is required');
      return;
    }
    
    if (!editForm.email.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }
    
    setUpdating(true);
    
    try {
      const payload = {
        full_name: editForm.full_name.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim().toLowerCase(),
        address: editForm.address.trim() || null,
      };
      
      console.log('📤 Updating profile:', payload);
      
      const response = await api.put('/auth/profile', payload);
      
      Alert.alert('Success', 'Profile updated successfully');
      setEditing(false);
      fetchProfile(); // Refresh profile data
      
    } catch (error: any) {
      console.log('❌ Update error:', error?.response?.data);
      
      let errorMessage = 'Failed to update profile';
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.errors) {
        const errors = Object.values(error.response.data.errors).flat();
        errorMessage = errors[0] as string;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = () => {
    router.push({
      pathname: '/(farmer)/change-password',
    } as any);
  };

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
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-RW', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getDisplayValue = (value: string | null | undefined) => {
    return value || 'Not provided';
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="sad-outline" size={60} color="#ccc" />
        <Text style={styles.errorText}>Failed to load profile</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
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
          colors={['#2E7D32']}
          tintColor="#2E7D32"
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          {profile.profile_image ? (
            <Image source={{ uri: profile.profile_image }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Text style={styles.profileImageText}>
                {getInitials(profile.full_name)}
              </Text>
            </View>
          )}
        </View>
        
        <Text style={styles.name}>{profile.full_name || 'User'}</Text>
        <Text style={styles.role}>Farmer</Text>
        
        {profile.is_verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.verifiedText}>Verified Account</Text>
          </View>
        )}
      </View>

      {/* Edit Button */}
      {!editing && (
        <TouchableOpacity style={styles.editButton} onPress={() => setEditing(true)}>
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      )}

      {/* Profile Info */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        {editing ? (
          // Edit Mode
          <View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={editForm.full_name}
                onChangeText={(text) => setEditForm({ ...editForm, full_name: text })}
                placeholder="Enter your full name"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                value={editForm.phone}
                onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email *</Text>
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
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editForm.address}
                onChangeText={(text) => setEditForm({ ...editForm, address: text })}
                placeholder="Enter your address"
                multiline
                numberOfLines={3}
              />
            </View>
            
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => {
                  setEditing(false);
                  if (profile) {
                    setEditForm({
                      full_name: profile.full_name || '',
                      phone: profile.phone || '',
                      email: profile.email || '',
                      address: profile.address || '',
                    });
                  }
                }}
                disabled={updating}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleUpdateProfile}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // View Mode
          <View>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={22} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValue}>{profile.full_name || 'Not provided'}</Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={22} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone Number</Text>
                <Text style={styles.infoValue}>{profile.phone || 'Not provided'}</Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={22} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email Address</Text>
                <Text style={styles.infoValue}>{profile.email || 'Not provided'}</Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={22} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>{getDisplayValue(profile.address)}</Text>
              </View>
            </View>
            
            {profile.district_id && (
              <View style={styles.infoRow}>
                <Ionicons name="business-outline" size={22} color="#666" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>District ID</Text>
                  <Text style={styles.infoValue}>{profile.district_id}</Text>
                </View>
              </View>
            )}
            
            {profile.province && (
              <View style={styles.infoRow}>
                <Ionicons name="map-outline" size={22} color="#666" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Province</Text>
                  <Text style={styles.infoValue}>{profile.province}</Text>
                </View>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={22} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Member Since</Text>
                <Text style={styles.infoValue}>{formatDate(profile.created_at)}</Text>
              </View>
            </View>
            
            {profile.updated_at && profile.updated_at !== profile.created_at && (
              <View style={styles.infoRow}>
                <Ionicons name="refresh-outline" size={22} color="#666" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Last Updated</Text>
                  <Text style={styles.infoValue}>{formatDate(profile.updated_at)}</Text>
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Security Section */}
      <View style={styles.securitySection}>
        <Text style={styles.sectionTitle}>Security</Text>
        
        <TouchableOpacity style={styles.securityButton} onPress={handleChangePassword}>
          <Ionicons name="key-outline" size={22} color="#2E7D32" />
          <Text style={styles.securityButtonText}>Change Password</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#D32F2F" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      {/* App Version */}
      <Text style={styles.versionText}>VetConnect Rwanda v1.0.0</Text>
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#2E7D32',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2E7D32',
    margin: 16,
    padding: 12,
    borderRadius: 10,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  infoSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2E7D32',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  securitySection: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  securityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  securityButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
  },
  logoutButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#D32F2F',
    marginLeft: 12,
    fontWeight: '500',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginBottom: 30,
  },
});