// src/app/index.tsx
import { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';

export default function SplashScreen() {
  const router = useRouter();
  const { user, token, hydrated } = useAuthStore();

  useEffect(() => {
    if (!hydrated) return;

    const timer = setTimeout(() => {
      if (user && token) {
        if (user.role === 'farmer') {
          router.replace('/(farmer)/dashboard');
        } else if (user.role === 'veterinarian') {
          router.replace('/(vet)/dashboard');
        } else if (user.role === 'super_admin' || user.role === 'district_admin') {
          router.replace('/(admin)/dashboard');
        } else {
          router.replace('/(auth)/login');
        }
      } else {
        router.replace('/(auth)/login');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [hydrated, user, token]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('@/assets/images/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Livestock Veterinary</Text>
        <Text style={styles.subtitle}>Care - Connect - Grow</Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>VetConnect Rwanda</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#E8F5E9',
    marginTop: 8,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
  },
  footerText: {
    color: '#E8F5E9',
    fontSize: 14,
  },
});