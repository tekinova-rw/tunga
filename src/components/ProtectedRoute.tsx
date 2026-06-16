// src/components/ProtectedRoute.tsx
import { useAuthStore } from '@/store/auth-store';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: string[];
}) {
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);

  if (!hydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  if (!user) {
    // FIXED: Use object syntax with type assertion
    return <Redirect href={{ pathname: '/(auth)/login' } as any} />;
  }

  if (roles && !roles.includes(user.role)) {
    // FIXED: Use object syntax with type assertion based on user role
    if (user.role === 'farmer') {
      return <Redirect href={{ pathname: '/(farmer)/dashboard' } as any} />;
    }
    if (user.role === 'veterinarian') {
      return <Redirect href={{ pathname: '/(vet)/dashboard' } as any} />;
    }
    if (user.role === 'super_admin' || user.role === 'district_admin') {
      return <Redirect href={{ pathname: '/(admin)/dashboard' } as any} />;
    }
    return <Redirect href={{ pathname: '/(auth)/login' } as any} />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});