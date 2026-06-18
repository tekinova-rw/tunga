// src/app/(farmer)/_layout.tsx
import { Stack } from 'expo-router';
import { QueryProvider } from '@/providers/query-provider';
import { useAuthStore } from '@/store/auth-store';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function FarmerLayout() {
  const { user, token, hydrated, isLoading } = useAuthStore();

  if (!hydrated || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  if (!user || !token) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user.role !== 'farmer') {
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
          name="requests"
          options={{
            title: 'Requests',
          }}
        />
        <Stack.Screen
          name="animals"
          options={{
            title: 'My Animals',
          }}
        />
        <Stack.Screen
          name="animals/add"
          options={{
            title: 'Add Animal',
          }}
        />
        <Stack.Screen
          name="animals/[id]"
          options={{
            title: 'Animal Details',
          }}
        />
        <Stack.Screen
          name="appointments"
          options={{
            title: 'Appointments',
          }}
        />
        {/* ✅ ADD THIS - Change Password Screen */}
        <Stack.Screen
          name="change-password"
          options={{
            title: 'Change Password',
            headerShown: true,
          }}
        />
      </Stack>
    </QueryProvider>
  );
}