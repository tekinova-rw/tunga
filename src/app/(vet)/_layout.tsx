// src/app/(vet)/_layout.tsx
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function VetLayout() {
  const { user, token, hydrated, hydrate } = useAuthStore();

  useEffect(() => {
    if (!hydrated) {
      hydrate();
    }
  }, [hydrated]);

  // Show loading while hydrating
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
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  // Redirect if not authenticated
  if (!user || !token) {
    return <Redirect href="/(auth)/login" />;
  }

  // ✅ Redirect if user is not a veterinarian
  if (user.role !== 'veterinarian') {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'farmer') {
      return <Redirect href="/(farmer)/dashboard" />;
    }
    if (user.role === 'super_admin' || user.role === 'district_admin') {
      return <Redirect href="/(admin)/dashboard" />;
    }
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitle: '',
      }}
    >
      <Stack.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="appointments"
        options={{
          title: 'Appointments',
        }}
      />
      <Stack.Screen
        name="requests"
        options={{
          title: 'Requests',
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
      <Stack.Screen
        name="explore"
        options={{
          title: 'Explore',
        }}
      />
      <Stack.Screen
        name="messages"
        options={{
          title: 'Messages',
        }}
      />
      <Stack.Screen
        name="change-password"
        options={{
          title: 'Change Password',
        }}
      />
    </Stack>
  );
}