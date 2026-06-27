// ============================================================
// FILE: src/app/(auth)/_layout.tsx
// DESCRIPTION: Auth routes layout (login, register, etc.)
// ============================================================

import { Stack } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';

export default function AuthLayout() {
  const { user, token, isLoading, isAuthenticated, hydrate } = useAuth();

  // ✅ Ensure hydration happens
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('🔍 AuthLayout: Checking auth state...');
    }
  }, [isLoading, isAuthenticated]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  // ✅ If user is already logged in, redirect to appropriate dashboard
  if (isAuthenticated && user && token) {
    console.log('✅ User already authenticated, redirecting to dashboard');
    if (user.role === 'farmer') {
      return <Redirect href="/(farmer)/dashboard" />;
    }
    if (user.role === 'veterinarian') {
      return <Redirect href="/(vet)/dashboard" />;
    }
    if (user.role === 'super_admin' || user.role === 'district_admin') {
      return <Redirect href="/(admin)/dashboard" />;
    }
    // Fallback redirect
    return <Redirect href="/(auth)/login" />;
  }

  // ✅ Show auth screens
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