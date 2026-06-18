// src/app/(auth)/login.tsx
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';

import { useAuthStore } from '@/store/auth-store';
import { api } from '../../api/axios';

type LoginFormData = {
  identifier: string;
  password: string;
};

export default function LoginScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, validateSession } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      Keyboard.dismiss();
      setLoading(true);

      const loginValue = data.identifier.trim().toLowerCase();

      const payload = {
        login: loginValue, // email OR phone
        password: data.password,
      };

      console.log('📤 LOGIN PAYLOAD:', payload);
      console.log('📍 API URL:', api.defaults.baseURL);

      const response = await api.post('/auth/login', payload);

      console.log('📥 LOGIN RESPONSE:', response.data);

      const { token, refreshToken, user } = response.data;

      if (!token || !user) {
        Alert.alert('Login Failed', 'Invalid server response');
        return;
      }

      // ✅ Login the user
      await login(user, token, refreshToken);

      // ✅ Try to validate session, but don't fail if it doesn't work
      try {
        const isValid = await validateSession();
        if (!isValid) {
          console.log('⚠️ Session validation failed, but continuing anyway');
        }
      } catch (validationError) {
        console.log('⚠️ Session validation error:', validationError);
        // Continue anyway - user is logged in
      }

      Alert.alert('Success', `Welcome back, ${user.full_name || 'User'}!`);

      // ✅ Navigate based on user role
      const roleRoutes: Record<string, string> = {
        farmer: '/(farmer)/dashboard',
        veterinarian: '/(vet)/dashboard',
        super_admin: '/(admin)/dashboard',
        district_admin: '/(admin)/dashboard',
      };

      const route = roleRoutes[user.role] || '/';
      router.replace({
        pathname: route,
      } as any);

    } catch (error: any) {
      console.log('❌ LOGIN ERROR DETAILS:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code,
      });

      let errorMessage = 'Invalid email/phone or password';

      if (error.code === 'ERR_NETWORK') {
        errorMessage = `Cannot reach server at ${api.defaults.baseURL}\n\nMake sure backend is running: npx ts-node src/server.ts`;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        
        // Customize messages for better user experience
        if (errorMessage === 'Verify your account first' || errorMessage === 'Please verify your email first') {
          errorMessage = 'Please verify your email address before logging in. Check your inbox for verification link.';
        } else if (errorMessage === 'Waiting for admin approval') {
          errorMessage = 'Your account is pending admin approval. You will be notified once approved.';
        } else if (errorMessage === 'Account has been suspended') {
          errorMessage = 'Your account has been suspended. Please contact support.';
        } else if (errorMessage === 'Invalid credentials') {
          errorMessage = 'Invalid email/phone or password. Please try again.';
        } else if (errorMessage === 'Account has been deleted') {
          errorMessage = 'Your account has been deleted. Please contact support.';
        } else if (errorMessage === 'Account is deactivated') {
          errorMessage = 'Your account is deactivated. Please contact support.';
        }
      } else if (error.message === 'Network Error') {
        errorMessage = `Network error - cannot connect to ${api.defaults.baseURL}`;
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout - server is not responding';
      }

      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push({
      pathname: '/(auth)/forgot-password',
    } as any);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          padding: 24,
          justifyContent: 'center',
        }}
      >
        {/* HEADER */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerIcon}>🐄</Text>
          <Text style={styles.headerTitle}>VetConnect Rwanda</Text>
          <Text style={styles.headerSubtitle}>
            Connect with veterinary professionals
          </Text>
        </View>

        {/* EMAIL OR PHONE */}
        <Text style={styles.label}>Email or Phone</Text>

        <Controller
          control={control}
          name="identifier"
          rules={{
            required: 'Email or phone is required',
          }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[
                styles.input,
                errors.identifier && styles.inputError,
              ]}
              placeholder="email@example.com or 078XXXXXXX"
              autoCapitalize="none"
              keyboardType="default"
              value={value}
              onChangeText={onChange}
            />
          )}
        />

        {errors.identifier && (
          <Text style={styles.errorText}>{errors.identifier.message}</Text>
        )}

        {/* PASSWORD */}
        <Text style={[styles.label, { marginTop: 15 }]}>Password</Text>

        <View style={styles.passwordContainer}>
          <Controller
            control={control}
            name="password"
            rules={{
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Minimum 6 characters',
              },
            }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[
                  styles.passwordInput,
                  errors.password && styles.inputError,
                ]}
                secureTextEntry={!showPassword}
                placeholder="Enter your password"
                value={value}
                onChangeText={onChange}
              />
            )}
          />

          <TouchableOpacity 
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color="#555"
            />
          </TouchableOpacity>
        </View>

        {errors.password && (
          <Text style={styles.errorText}>{errors.password.message}</Text>
        )}

        {/* FORGOT PASSWORD LINK */}
        <TouchableOpacity 
          onPress={handleForgotPassword}
          style={styles.forgotPasswordLink}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* LOGIN BUTTON */}
        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        {/* REGISTER LINK */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* DEBUG INFO - Remove in production */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>
              API: {api.defaults.baseURL}
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerIcon: {
    fontSize: 50,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1B5E20',
  },
  headerSubtitle: {
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  label: {
    marginBottom: 5,
    fontWeight: '500',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    marginTop: 5,
    fontSize: 12,
  },
  passwordContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    alignItems: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 8,
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotPasswordText: {
    color: '#2E7D32',
    fontSize: 12,
  },
  loginButton: {
    backgroundColor: '#2E7D32',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    color: '#666',
    fontSize: 14,
  },
  registerLink: {
    color: '#2E7D32',
    fontWeight: '700',
    fontSize: 14,
  },
  debugContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  debugText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
});