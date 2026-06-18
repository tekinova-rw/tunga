// src/app/(auth)/_layout.tsx
import { Stack } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function AuthLayout() {
  const { user, token, hydrated, isLoading } = useAuthStore();

  // Show loading while hydrating
  if (!hydrated || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  // If user is already logged in, redirect to appropriate dashboard
  if (user && token) {
    if (user.role === 'farmer') {
      return <Redirect href="/(farmer)/dashboard" />;
    }
    if (user.role === 'veterinarian') {
      return <Redirect href="/(vet)/dashboard" />;
    }
    if (user.role === 'super_admin' || user.role === 'district_admin') {
      return <Redirect href="/(admin)/dashboard" />;
    }
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: '#f5f5f5',
        },
      }}
    >
      <Stack.Screen 
        name="onboarding" 
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="role-selection" 
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="login" 
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="register" 
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="forgot-password" 
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="reset-password" 
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
    </Stack>
  );
}