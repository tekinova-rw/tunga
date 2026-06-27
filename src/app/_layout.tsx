// ============================================================
// FILE: src/app/_layout.tsx
// DESCRIPTION: Root layout with navigation for all user roles
// ============================================================

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { QueryProvider } from '@/providers/query-provider';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useState, useRef } from 'react';

// Loading screen with timeout detection
function LoadingScreen() {
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowError(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 20,
      }}
    >
      <ActivityIndicator size="large" color="#2E7D32" />
      <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>Loading...</Text>
      {showError && (
        <Text style={{ marginTop: 16, fontSize: 14, color: '#D32F2F', textAlign: 'center' }}>
          Taking longer than expected. Please check your connection.
        </Text>
      )}
    </View>
  );
}

function RootNavigator() {
  const { isLoading, isAuthenticated, user, hydrate } = useAuth();
  const [hydrationAttempts, setHydrationAttempts] = useState(0);
  const hasHydratedRef = useRef(false);

  // ✅ Only hydrate once on mount
  useEffect(() => {
    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      console.log('🔍 Initial hydration...');
      hydrate();
    }
  }, []);

  // ✅ Log auth state changes
  useEffect(() => {
    console.log('🔍 Auth State:', { isLoading, isAuthenticated, user: user?.role });
  }, [isLoading, isAuthenticated, user]);

  // Show loading while checking auth
  if (isLoading) {
    return <LoadingScreen />;
  }

  // ✅ If not authenticated, show auth screens (not redirect)
  if (!isAuthenticated) {
    console.log('🔴 Not authenticated - showing auth screens');
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack>
    );
  }

  // ✅ If authenticated, show role-based navigation
  console.log('✅ Authenticated - showing app screens');
  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2E7D32',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitle: '',
        animation: 'slide_from_right',
      }}
    >
      {/* Auth Routes - Keep for logout/switch account */}
      <Stack.Screen
        name="(auth)"
        options={{
          headerShown: false,
        }}
      />

      {/* Farmer Routes */}
      <Stack.Screen
        name="(farmer)"
        options={{
          headerShown: false,
        }}
      />

      {/* Vet Routes */}
      <Stack.Screen
        name="(vet)"
        options={{
          headerShown: false,
        }}
      />

      {/* Admin Routes */}
      <Stack.Screen
        name="(admin)"
        options={{
          headerShown: false,
        }}
      />

      {/* Shared Screens */}
      <Stack.Screen
        name="public-chat"
        options={{
          title: '💬 Public Chat',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#1B5E20',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />

      <Stack.Screen
        name="ai-chat"
        options={{
          title: '🤖 AI Assistant',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#1B5E20',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />

      <Stack.Screen
        name="change-password"
        options={{
          title: 'Change Password',
          headerShown: true,
          presentation: 'modal',
        }}
      />

      <Stack.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          headerShown: true,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthProvider>
        <QueryProvider>
          <RootNavigator />
        </QueryProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}