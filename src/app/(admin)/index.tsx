// src/app/(admin)/index.tsx
import React, { useEffect } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { Redirect } from 'expo-router';

import { useAuthStore } from '@/store/auth-store';

export default function AdminIndex() {
  const { user, hydrated, hydrate, isLoading } = useAuthStore();

  useEffect(() => {
    if (!hydrated) {
      hydrate();
    }
  }, [hydrated]);

  // Show loading while hydrating
  if (!hydrated || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#D32F2F" />
        <Text style={{ marginTop: 12, color: '#666', fontSize: 14 }}>Loading...</Text>
      </View>
    );
  }

  // No user → redirect to login
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // Role-based routing
  switch (user.role) {
    case 'farmer':
      return <Redirect href="/(farmer)/dashboard" />;

    case 'veterinarian':
      return <Redirect href="/(vet)/dashboard" />;

    case 'super_admin':
    case 'district_admin':
      return <Redirect href="/(admin)/dashboard" />;

    default:
      return <Redirect href="/(auth)/login" />;
  }
}