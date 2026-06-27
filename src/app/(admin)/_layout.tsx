// ============================================================
// FILE: src/app/(admin)/_layout.tsx
// DESCRIPTION: Admin app layout with tabs and navigation
// ============================================================

import { Tabs, Redirect } from 'expo-router';
import { useEffect } from 'react';
import { View, ActivityIndicator, ColorValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth-store';

// ------------------------------------------------------------
// Tab Icon Component
// ------------------------------------------------------------
const TabIcon = ({
  name,
  color,
  size,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: ColorValue;
  size: number;
}) => {
  return <Ionicons name={name} size={size} color={color as string} />;
};

// ------------------------------------------------------------
// Admin Layout
// ------------------------------------------------------------
export default function AdminLayout() {
  const { user, token, hydrated, hydrate } = useAuthStore();

  useEffect(() => {
    if (!hydrated) {
      hydrate();
    }
  }, [hydrated, hydrate]);

  // ----------------------------------------------------------
  // Loading State
  // ----------------------------------------------------------
  if (!hydrated) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f5f5f5',
        }}
      >
        <ActivityIndicator size="large" color="#D32F2F" />
      </View>
    );
  }

  // ----------------------------------------------------------
  // Authentication Check
  // ----------------------------------------------------------
  if (!user || !token) {
    return <Redirect href="/(auth)/login" />;
  }

  // ----------------------------------------------------------
  // Role Check
  // ----------------------------------------------------------
  if (
    user.role !== 'super_admin' &&
    user.role !== 'district_admin'
  ) {
    if (user.role === 'farmer') {
      return <Redirect href="/(farmer)/dashboard" />;
    }

    if (user.role === 'veterinarian') {
      return <Redirect href="/(vet)/dashboard" />;
    }

    return <Redirect href="/(auth)/login" />;
  }

  const isSuperAdmin = user.role === 'super_admin';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#D32F2F',
        tabBarInactiveTintColor: '#999',

        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },

        headerStyle: {
          backgroundColor: '#D32F2F',
        },

        headerTintColor: '#fff',

        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {/* Dashboard */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <TabIcon
              name="stats-chart-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* Users */}
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          headerShown: true,
          tabBarIcon: ({ color, size }) => (
            <TabIcon
              name="people-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* Admin Management */}
      <Tabs.Screen
        name="admin-management"
        options={{
          title: 'Admins',
          headerShown: true,

          // Hide for district admins
          href: isSuperAdmin ? undefined : null,

          tabBarIcon: ({ color, size }) => (
            <TabIcon
              name="shield-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* Reports */}
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          headerShown: true,
          tabBarIcon: ({ color, size }) => (
            <TabIcon
              name="document-text-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* Public Chat */}
      <Tabs.Screen
        name="public-chat"
        options={{
          title: 'Chat',
          headerShown: true,
          tabBarIcon: ({ color, size }) => (
            <TabIcon
              name="chatbubbles-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* Settings */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: true,
          tabBarIcon: ({ color, size }) => (
            <TabIcon
              name="settings-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}