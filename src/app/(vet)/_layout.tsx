// ============================================================
// FILE: src/app/(vet)/_layout.tsx
// DESCRIPTION: Veterinarian app layout with tabs and navigation
// ============================================================

import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, ColorValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Tab Icon helper
const TabIcon = ({
  name,
  color,
  size,
}: {
  name: any;
  color: ColorValue;
  size: number;
}) => {
  return <Ionicons name={name} size={size} color={color as string} />;
};

export default function VetLayout() {
  const { user, token, hydrated, hydrate } = useAuthStore();

  // ensure hydration
  useEffect(() => {
    if (!hydrated) {
      hydrate();
    }
  }, [hydrated]);

  // LOADING STATE
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
        <ActivityIndicator size="large" color="#7B1FA2" />
      </View>
    );
  }

  // AUTH CHECK
  if (!user || !token) {
    return <Redirect href="/(auth)/login" />;
  }

  // ROLE GUARD
  if (user.role !== 'veterinarian') {
    if (user.role === 'farmer') {
      return <Redirect href="/(farmer)/dashboard" />;
    }
    if (
      user.role === 'super_admin' ||
      user.role === 'district_admin'
    ) {
      return <Redirect href="/(admin)/dashboard" />;
    }
    return <Redirect href="/(auth)/login" />;
  }

  // ============================================================
  // MAIN NAVIGATION (TABS ONLY - FIXED)
  // ============================================================
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#7B1FA2',
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
          backgroundColor: '#7B1FA2',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        // ✅ FIX: headerBackTitle removed - it doesn't exist in Tabs
      }}
    >
      {/* Dashboard */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="home-outline" color={color} size={size} />
          ),
        }}
      />

      {/* Appointments */}
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appointments',
          headerShown: true,
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="calendar-outline" color={color} size={size} />
          ),
        }}
      />

      {/* Messages */}
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Chat',
          headerShown: true,
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="chatbubbles-outline" color={color} size={size} />
          ),
        }}
      />

      {/* Requests */}
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Requests',
          headerShown: true,
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="document-text-outline" color={color} size={size} />
          ),
        }}
      />

      {/* Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: true,
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}