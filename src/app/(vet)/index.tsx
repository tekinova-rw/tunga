// src/app/(vet)/index.tsx
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';

import { useAuthStore } from '@/store/auth-store';

export default function Index() {
  const { user, hydrated, hydrate } = useAuthStore();

  /**
   * 🚨 Hydrate ONCE at app start
   */
  useEffect(() => {
    if (!hydrated) {
      hydrate();
    }
  }, [hydrated]);

  /**
   * ⏳ Loading gate
   */
  if (!hydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  /**
   * 🚪 No session → auth flow
   */
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  /**
   * 🧭 Role routing (single source of truth)
   */
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