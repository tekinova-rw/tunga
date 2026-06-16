// src/app/(farmer)/_layout.tsx
import { Stack } from 'expo-router';
import { QueryProvider } from '@/providers/query-provider';
import { useAuthStore } from '@/store/auth-store';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function FarmerLayout() {
  const { user, token, hydrated, isLoading } = useAuthStore();

  // Show loading while hydrating
  if (!hydrated || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  // Redirect if not authenticated or not a farmer
  if (!user || !token) {
    return <Redirect href="/(auth)/login" />;
  }

  // Redirect if user is not a farmer
  if (user.role !== 'farmer') {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'veterinarian') {
      return <Redirect href="/(vet)/dashboard" />;
    }
    if (user.role === 'super_admin' || user.role === 'district_admin') {
      return <Redirect href="/(admin)/dashboard" />;
    }
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <QueryProvider>
      <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#2E7D32',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerBackTitle: 'Back',
          // ✅ REMOVED: headerBackTitleVisible is not valid in Expo Router
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
          name="profile"
          options={{
            title: 'Profile',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="animals"
          options={{
            title: 'My Animals',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="animals/add"
          options={{
            title: 'Add Animal',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="animals/[id]"
          options={{
            title: 'Animal Details',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="requests"
          options={{
            title: 'Veterinary Requests',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="appointments"
          options={{
            title: 'Appointments',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="messages"
          options={{
            title: 'Messages',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="change-password"
          options={{
            title: 'Change Password',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="explore"
          options={{
            title: 'Explore',
            headerShown: true,
          }}
        />
      </Stack>
    </QueryProvider>
  );
}