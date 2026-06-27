// ============================================================
// FILE: src/app/(farmer)/_layout.tsx
// DESCRIPTION: Farmer app layout with tabs and navigation
// ============================================================

import { QueryProvider } from '@/providers/query-provider';
import { useAuthStore } from '@/store/auth-store';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ColorValue, View } from 'react-native';

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

export default function FarmerLayout() {
  const { user, token, hydrated, isLoading } = useAuthStore();
  const [forceShow, setForceShow] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!hydrated || isLoading) {
        setForceShow(true);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [hydrated, isLoading]);

  if ((!hydrated || isLoading) && !forceShow) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f5f5f5',
        }}
      >
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

    if (
      user.role === 'super_admin' ||
      user.role === 'district_admin'
    ) {
      return <Redirect href="/(admin)/dashboard" />;
    }

    return <Redirect href="/(auth)/login" />;
  }

  return (
    <QueryProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#2E7D32',
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
            backgroundColor: '#2E7D32',
          },

          headerTintColor: '#fff',

          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Home',
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <TabIcon
                name="home-outline"
                color={color}
                size={size}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="animals"
          options={{
            title: 'Animals',
            headerShown: true,
            tabBarIcon: ({ color, size }) => (
              <TabIcon
                name="paw-outline"
                color={color}
                size={size}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="chat"
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

        <Tabs.Screen
          name="requests"
          options={{
            title: 'Requests',
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

        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            headerShown: true,
            tabBarIcon: ({ color, size }) => (
              <TabIcon
                name="person-outline"
                color={color}
                size={size}
              />
            ),
          }}
        />

        {/* Hidden Routes */}
        <Tabs.Screen
          name="public-chat"
          options={{
            title: 'Public Chat',
            headerShown: true,
            href: null,
          }}
        />

        <Tabs.Screen
          name="ai-chat"
          options={{
            title: 'AI Assistant',
            headerShown: true,
            href: null,
          }}
        />

        <Tabs.Screen
          name="animals/add"
          options={{
            title: 'Add Animal',
            headerShown: true,
            href: null,
          }}
        />

        <Tabs.Screen
          name="animals/[id]"
          options={{
            title: 'Animal Details',
            headerShown: true,
            href: null,
          }}
        />

        <Tabs.Screen
          name="change-password"
          options={{
            title: 'Change Password',
            headerShown: true,
            href: null,
          }}
        />

        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            headerShown: true,
            href: null,
          }}
        />
      </Tabs>
    </QueryProvider>
  );
}