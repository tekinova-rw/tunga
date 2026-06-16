// src/app/(auth)/register.tsx
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
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { api } from '../../api/axios';

type RegisterFormData = {
  full_name: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<RegisterFormData>({
    defaultValues: {
      full_name: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      Keyboard.dismiss();
      setLoading(true);

      // =========================
      // CLEAN DATA
      // =========================
      const payload = {
        full_name: data.full_name.trim(),
        phone: data.phone.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        district_id: 1, // ✅ REQUIRED by backend - Using district ID 1
        role: 'farmer', // ✅ Farmers are auto-verified
      };

      console.log('REGISTER PAYLOAD:', payload);
      console.log('API URL:', api.defaults.baseURL);

      const response = await api.post('/auth/register', payload);

      console.log('RESPONSE:', response.data);

      // ✅ FIXED: Show correct message for farmers (auto-verified)
      // Farmers don't need email verification, they can login immediately
      const successMessage = 
        'Account created successfully! 🎉\n\nYou can now login with your email or phone number.';

      Alert.alert('Success', successMessage);

      reset();
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 1500);

    } catch (error: any) {
      console.log('REGISTER ERROR DETAILS:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code,
      });

      let errorMessage = 'Something went wrong';

      if (error.code === 'ERR_NETWORK') {
        errorMessage = `Cannot reach server at ${api.defaults.baseURL}\n\nMake sure backend is running: npx ts-node src/server.ts`;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        
        // Make error messages more user-friendly
        if (errorMessage === 'User already exists') {
          errorMessage = 'An account with this email or phone number already exists. Please login instead.';
        } else if (errorMessage === 'Missing fields') {
          errorMessage = 'Please fill in all required fields.';
        }
      } else if (error.message === 'Network Error') {
        errorMessage = `Network error - cannot connect to ${api.defaults.baseURL}`;
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout - server is not responding';
      }

      Alert.alert('Register Failed', errorMessage);
    } finally {
      setLoading(false);
    }
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
        <View style={{ alignItems: 'center', marginBottom: 30 }}>
          <Text style={{ fontSize: 50 }}>🐄</Text>
          <Text style={{ fontSize: 26, fontWeight: '700', color: '#1B5E20' }}>
            VetConnect Rwanda
          </Text>
          <Text style={{ color: '#666', textAlign: 'center', marginTop: 5 }}>
            Create your farmer account
          </Text>
        </View>

        {/* FULL NAME */}
        <Text style={{ marginBottom: 5, fontWeight: '500' }}>Full Name</Text>
        <Controller
          control={control}
          name="full_name"
          rules={{ required: 'Full name is required' }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: errors.full_name ? '#ff4444' : '#ddd',
                padding: 12,
                borderRadius: 10,
                fontSize: 16,
              }}
              placeholder="John Doe"
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        {errors.full_name && (
          <Text style={{ color: '#ff4444', marginTop: 5, fontSize: 12 }}>
            {errors.full_name.message}
          </Text>
        )}

        {/* EMAIL */}
        <Text style={{ marginTop: 15, marginBottom: 5, fontWeight: '500' }}>Email</Text>
        <Controller
          control={control}
          name="email"
          rules={{
            required: 'Email is required',
            pattern: {
              value: /\S+@\S+\.\S+/,
              message: 'Please enter a valid email address',
            },
          }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: errors.email ? '#ff4444' : '#ddd',
                padding: 12,
                borderRadius: 10,
                fontSize: 16,
              }}
              placeholder="farmer@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        {errors.email && (
          <Text style={{ color: '#ff4444', marginTop: 5, fontSize: 12 }}>
            {errors.email.message}
          </Text>
        )}

        {/* PHONE */}
        <Text style={{ marginTop: 15, marginBottom: 5, fontWeight: '500' }}>Phone Number</Text>
        <Controller
          control={control}
          name="phone"
          rules={{
            required: 'Phone number is required',
            pattern: {
              value: /^07[2389][0-9]{7}$/,
              message: 'Enter a valid Rwanda phone number (e.g., 0781234567)',
            },
          }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: errors.phone ? '#ff4444' : '#ddd',
                padding: 12,
                borderRadius: 10,
                fontSize: 16,
              }}
              placeholder="078XXXXXXX"
              keyboardType="phone-pad"
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        {errors.phone && (
          <Text style={{ color: '#ff4444', marginTop: 5, fontSize: 12 }}>
            {errors.phone.message}
          </Text>
        )}

        {/* PASSWORD */}
        <Text style={{ marginTop: 15, marginBottom: 5, fontWeight: '500' }}>Password</Text>
        <View
          style={{
            flexDirection: 'row',
            borderWidth: 1,
            borderColor: errors.password ? '#ff4444' : '#ddd',
            borderRadius: 10,
            alignItems: 'center',
            paddingHorizontal: 10,
          }}
        >
          <Controller
            control={control}
            name="password"
            rules={{
              required: 'Password is required',
              minLength: { value: 6, message: 'Password must be at least 6 characters' },
            }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={{ flex: 1, padding: 12, fontSize: 16 }}
                secureTextEntry={!showPassword}
                placeholder="Enter your password"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color="#555"
            />
          </TouchableOpacity>
        </View>
        {errors.password && (
          <Text style={{ color: '#ff4444', marginTop: 5, fontSize: 12 }}>
            {errors.password.message}
          </Text>
        )}

        {/* CONFIRM PASSWORD */}
        <Text style={{ marginTop: 15, marginBottom: 5, fontWeight: '500' }}>Confirm Password</Text>
        <View
          style={{
            flexDirection: 'row',
            borderWidth: 1,
            borderColor: errors.confirmPassword ? '#ff4444' : '#ddd',
            borderRadius: 10,
            alignItems: 'center',
            paddingHorizontal: 10,
          }}
        >
          <Controller
            control={control}
            name="confirmPassword"
            rules={{
              required: 'Please confirm your password',
              validate: (value) => value === password || 'Passwords do not match',
            }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={{ flex: 1, padding: 12, fontSize: 16 }}
                secureTextEntry={!showConfirmPassword}
                placeholder="Confirm your password"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <Ionicons
              name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color="#555"
            />
          </TouchableOpacity>
        </View>
        {errors.confirmPassword && (
          <Text style={{ color: '#ff4444', marginTop: 5, fontSize: 12 }}>
            {errors.confirmPassword.message}
          </Text>
        )}

        {/* REGISTER BUTTON */}
        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
          style={{
            backgroundColor: '#2E7D32',
            padding: 15,
            borderRadius: 10,
            marginTop: 20,
            alignItems: 'center',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
              Create Account
            </Text>
          )}
        </TouchableOpacity>

        {/* LOGIN LINK */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
          <Text>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={{ color: '#2E7D32', fontWeight: '700' }}>
                Login
              </Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* INFO NOTE */}
        <View style={{ 
          marginTop: 20, 
          padding: 12, 
          backgroundColor: '#E8F5E9', 
          borderRadius: 8,
          borderLeftWidth: 3,
          borderLeftColor: '#2E7D32',
        }}>
          <Text style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>
            ℹ️ Farmers are automatically verified and can login immediately after registration.
          </Text>
        </View>

        {/* DEBUG INFO - Only in development */}
        {__DEV__ && (
          <View style={{ marginTop: 20, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 8 }}>
            <Text style={{ fontSize: 10, color: '#666', textAlign: 'center' }}>
              API: {api.defaults.baseURL}
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}