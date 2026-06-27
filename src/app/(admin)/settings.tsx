// ============================================================
// FILE: src/app/(admin)/settings.tsx
// DESCRIPTION: Settings screen for admins
// ============================================================

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/auth-store';

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();

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

  const settingsItems = [
    {
      icon: 'person-outline',
      label: 'Profile',
      onPress: () => router.push('/(admin)/dashboard'), // Navigate to dashboard where profile info is shown
    },
    {
      icon: 'lock-closed-outline',
      label: 'Change Password',
      onPress: () => router.push('/(admin)/dashboard'), // This should be handled in profile section
    },
    {
      icon: 'notifications-outline',
      label: 'Notifications',
      onPress: () => Alert.alert('Coming Soon', 'Notifications feature will be available soon'),
    },
    {
      icon: 'information-circle-outline',
      label: 'About',
      onPress: () => {
        Alert.alert(
          'About VetConnect',
          'VetConnect Rwanda\n\nConnecting farmers with veterinary professionals.\n\nVersion 1.0.0\n\n© 2026 VetConnect Rwanda'
        );
      },
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⚙️ Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.full_name?.charAt(0) || 'A'}</Text>
        </View>
        <Text style={styles.profileName}>{user?.full_name || 'Admin'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {user?.role?.replace('_', ' ').toUpperCase() || 'ADMIN'}
          </Text>
        </View>
        <Text style={styles.profileEmail}>{user?.email || 'admin@vetconnect.rw'}</Text>
        
        <TouchableOpacity 
          style={styles.editProfileButton}
          onPress={() => Alert.alert('Edit Profile', 'Profile editing coming soon!')}
        >
          <Text style={styles.editProfileText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        {settingsItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.settingItem,
              index === settingsItems.length - 1 && styles.settingItemLast,
            ]}
            onPress={item.onPress}
          >
            <View style={styles.settingItemLeft}>
              <Ionicons name={item.icon as any} size={22} color="#666" />
              <Text style={styles.settingItemLabel}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingItemLeft}>
            <Ionicons name="moon-outline" size={22} color="#666" />
            <Text style={styles.settingItemLabel}>Dark Mode</Text>
          </View>
          <Text style={styles.comingSoonText}>Coming Soon</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.settingItem, styles.settingItemLast]}
          onPress={() => Alert.alert('Language', 'Language selection coming soon!')}
        >
          <View style={styles.settingItemLeft}>
            <Ionicons name="language-outline" size={22} color="#666" />
            <Text style={styles.settingItemLabel}>Language</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color="#D32F2F" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>Version 1.0.0</Text>
      <Text style={styles.copyrightText}>© 2026 VetConnect Rwanda</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
  headerSpacer: {
    width: 32,
  },
  profileSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D32F2F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  roleBadge: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D32F2F',
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  editProfileButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 20,
  },
  editProfileText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    padding: 16,
    paddingBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingItemLabel: {
    fontSize: 15,
    color: '#333',
  },
  comingSoonText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    gap: 8,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D32F2F',
  },
  versionText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 16,
  },
  copyrightText: {
    textAlign: 'center',
    color: '#ccc',
    fontSize: 11,
    marginTop: 4,
    marginBottom: 24,
  },
});