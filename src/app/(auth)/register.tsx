// ============================================================
// FILE: src/app/(auth)/register.tsx
// DESCRIPTION: Register screen with role selection
// ============================================================

import { useState, useEffect } from 'react';
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
import { api } from '@/services/api';

type RegisterFormData = {
  full_name: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  district_id: number;
  // Veterinarian specific fields
  license_number?: string;
  specialization?: string;
  years_experience?: string;
  clinic_name?: string;
  clinic_address?: string;
};

type District = {
  id: number;
  name: string;
  province: string;
};

export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(true);
  const [districts, setDistricts] = useState<District[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('farmer');
  const [showVetFields, setShowVetFields] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<number>(1);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    defaultValues: {
      full_name: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'farmer',
      district_id: 1,
      license_number: '',
      specialization: '',
      years_experience: '',
      clinic_name: '',
      clinic_address: '',
    },
  });

  const password = watch('password');

  const roles = [
    { id: 'farmer', label: 'Farmer', icon: '🌾', description: 'Manage your livestock' },
    { id: 'veterinarian', label: 'Veterinarian', icon: '🩺', description: 'Provide veterinary services' },
  ];

  // Load districts
  useEffect(() => {
    const loadDistricts = async () => {
      try {
        setLoadingDistricts(true);
        const response = await api.get('/districts');
        const data = response.data.data || response.data;
        setDistricts(Array.isArray(data) ? data : []);
        if (data && data.length > 0) {
          setSelectedDistrict(data[0].id);
          setValue('district_id', data[0].id);
        }
      } catch (error) {
        console.error('Load districts error:', error);
        // Fallback districts
        setDistricts([
          { id: 1, name: 'Gasabo', province: 'Kigali' },
          { id: 2, name: 'Kicukiro', province: 'Kigali' },
          { id: 3, name: 'Nyarugenge', province: 'Kigali' },
        ]);
      } finally {
        setLoadingDistricts(false);
      }
    };
    loadDistricts();
  }, []);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      Keyboard.dismiss();
      setLoading(true);

      const payload = {
        full_name: data.full_name.trim(),
        phone: data.phone.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        district_id: data.district_id || 1,
        role: selectedRole || 'farmer',
      };

      // ✅ Add veterinarian specific fields if role is veterinarian
      if (selectedRole === 'veterinarian') {
        Object.assign(payload, {
          license_number: data.license_number?.trim() || null,
          specialization: data.specialization?.trim() || null,
          years_experience: data.years_experience ? parseInt(data.years_experience) : 0,
          clinic_name: data.clinic_name?.trim() || null,
          clinic_address: data.clinic_address?.trim() || null,
        });
      }

      console.log('📤 REGISTER PAYLOAD:', payload);
      console.log('📍 API URL:', api.defaults.baseURL);

      const response = await api.post('/auth/register', payload);

      console.log('📥 RESPONSE:', response.data);

      // ✅ Check if response is successful
      const responseData = response.data;
      
      // ✅ Handle response - backend returns { success: true, message: "...", data: {...} }
      if (responseData && responseData.success === true) {
        // ✅ Different messages based on role
        let successMessage = '';
        if (selectedRole === 'veterinarian') {
          successMessage = 
            'Veterinarian Account Created! 🩺\n\n' +
            'Your account is pending admin approval.\n' +
            'You will be notified once approved.\n\n' +
            'You can login after approval.';
        } else {
          successMessage = 
            'Account created successfully! 🎉\n\n' +
            'You can now login with your email or phone number.';
        }

        // ✅ Show success alert with OK button
        Alert.alert(
          'Success', 
          successMessage,
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form
                reset();
                setSelectedRole('farmer');
                setShowVetFields(false);
                setSelectedDistrict(districts[0]?.id || 1);
                // Navigate to login
                router.replace('/(auth)/login');
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        // ❌ Registration failed
        const errorMsg = responseData?.message || 'Registration failed. Please try again.';
        Alert.alert('Registration Failed', errorMsg);
      }

    } catch (error: any) {
      console.log('❌ REGISTER ERROR DETAILS:', {
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
        } else if (errorMessage === 'Server error') {
          errorMessage = 'Server error. Please try again later.';
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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerIcon}>🐄</Text>
          <Text style={styles.headerTitle}>VetConnect Rwanda</Text>
          <Text style={styles.headerSubtitle}>Create your account</Text>
        </View>

        {/* FULL NAME */}
        <Text style={styles.label}>Full Name *</Text>
        <Controller
          control={control}
          name="full_name"
          rules={{ required: 'Full name is required' }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[
                styles.input,
                errors.full_name && styles.inputError,
              ]}
              placeholder="John Doe"
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        {errors.full_name && (
          <Text style={styles.errorText}>{errors.full_name.message}</Text>
        )}

        {/* EMAIL */}
        <Text style={[styles.label, { marginTop: 15 }]}>Email *</Text>
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
              style={[
                styles.input,
                errors.email && styles.inputError,
              ]}
              placeholder="farmer@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        {errors.email && (
          <Text style={styles.errorText}>{errors.email.message}</Text>
        )}

        {/* PHONE */}
        <Text style={[styles.label, { marginTop: 15 }]}>Phone Number *</Text>
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
              style={[
                styles.input,
                errors.phone && styles.inputError,
              ]}
              placeholder="078XXXXXXX"
              keyboardType="phone-pad"
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        {errors.phone && (
          <Text style={styles.errorText}>{errors.phone.message}</Text>
        )}

        {/* PASSWORD */}
        <Text style={[styles.label, { marginTop: 15 }]}>Password *</Text>
        <View style={[
          styles.passwordContainer,
          errors.password && styles.inputError,
        ]}>
          <Controller
            control={control}
            name="password"
            rules={{
              required: 'Password is required',
              minLength: { value: 6, message: 'Password must be at least 6 characters' },
            }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.passwordInput}
                secureTextEntry={!showPassword}
                placeholder="Enter your password"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
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

        {/* CONFIRM PASSWORD */}
        <Text style={[styles.label, { marginTop: 15 }]}>Confirm Password *</Text>
        <View style={[
          styles.passwordContainer,
          errors.confirmPassword && styles.inputError,
        ]}>
          <Controller
            control={control}
            name="confirmPassword"
            rules={{
              required: 'Please confirm your password',
              validate: (value) => value === password || 'Passwords do not match',
            }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.passwordInput}
                secureTextEntry={!showConfirmPassword}
                placeholder="Confirm your password"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
            <Ionicons
              name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color="#555"
            />
          </TouchableOpacity>
        </View>
        {errors.confirmPassword && (
          <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
        )}

        {/* ✅ DISTRICT SELECTION */}
        <Text style={[styles.label, { marginTop: 15 }]}>District *</Text>
        {loadingDistricts ? (
          <ActivityIndicator size="small" color="#2E7D32" />
        ) : (
          <View style={styles.districtContainer}>
            {districts.map((district) => (
              <TouchableOpacity
                key={district.id}
                style={[
                  styles.districtCard,
                  selectedDistrict === district.id && styles.districtCardSelected,
                ]}
                onPress={() => {
                  setSelectedDistrict(district.id);
                  setValue('district_id', district.id);
                }}
              >
                <Text style={[
                  styles.districtName,
                  selectedDistrict === district.id && styles.districtNameSelected,
                ]}>
                  {district.name}
                </Text>
                <Text style={styles.districtProvince}>{district.province}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ✅ ROLE SELECTION */}
        <Text style={[styles.label, { marginTop: 15 }]}>Select Role *</Text>
        <View style={styles.roleContainer}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.id}
              style={[
                styles.roleCard,
                selectedRole === role.id && styles.roleCardSelected,
              ]}
              onPress={() => {
                setSelectedRole(role.id);
                setShowVetFields(role.id === 'veterinarian');
                setValue('role', role.id);
              }}
            >
              <Text style={styles.roleIcon}>{role.icon}</Text>
              <Text style={[
                styles.roleLabel,
                selectedRole === role.id && styles.roleLabelSelected,
              ]}>
                {role.label}
              </Text>
              <Text style={styles.roleDescription}>{role.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ✅ Role Info Note */}
        {selectedRole === 'veterinarian' && (
          <View style={styles.vetInfoContainer}>
            <Ionicons name="information-circle" size={20} color="#FF9800" />
            <Text style={styles.vetInfoText}>
              Veterinarians need admin approval before accessing the platform.
              You will be notified once your account is approved.
            </Text>
          </View>
        )}

        {selectedRole === 'farmer' && (
          <View style={styles.farmerInfoContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.farmerInfoText}>
              Farmers are automatically verified and can login immediately.
            </Text>
          </View>
        )}

        {/* ✅ Veterinarian Specific Fields */}
        {showVetFields && (
          <View style={styles.vetFieldsContainer}>
            <Text style={styles.vetFieldsTitle}>Veterinary Professional Details</Text>
            
            {/* License Number */}
            <Text style={styles.label}>License Number</Text>
            <Controller
              control={control}
              name="license_number"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Enter your license number"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />

            {/* Specialization */}
            <Text style={[styles.label, { marginTop: 12 }]}>Specialization</Text>
            <Controller
              control={control}
              name="specialization"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Large Animal, Poultry, Surgery"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />

            {/* Years of Experience */}
            <Text style={[styles.label, { marginTop: 12 }]}>Years of Experience</Text>
            <Controller
              control={control}
              name="years_experience"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Number of years"
                  keyboardType="numeric"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />

            {/* Clinic Name */}
            <Text style={[styles.label, { marginTop: 12 }]}>Clinic / Practice Name</Text>
            <Controller
              control={control}
              name="clinic_name"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Clinic or practice name"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />

            {/* Clinic Address */}
            <Text style={[styles.label, { marginTop: 12 }]}>Clinic Address</Text>
            <Controller
              control={control}
              name="clinic_address"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Clinic address"
                  multiline
                  numberOfLines={3}
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
          </View>
        )}

        {/* REGISTER BUTTON */}
        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
          style={[styles.registerButton, loading && styles.registerButtonDisabled]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.registerButtonText}>
              {selectedRole === 'veterinarian' ? 'Register as Veterinarian' : 'Create Account'}
            </Text>
          )}
        </TouchableOpacity>

        {/* LOGIN LINK */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* DEBUG INFO - Only in development */}
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
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
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
  districtContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  districtCard: {
    flex: 1,
    minWidth: '30%',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  districtCardSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#E8F5E9',
  },
  districtName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  districtNameSelected: {
    color: '#2E7D32',
  },
  districtProvince: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 5,
  },
  roleCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  roleCardSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#E8F5E9',
  },
  roleIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  roleLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  roleLabelSelected: {
    color: '#2E7D32',
  },
  roleDescription: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginTop: 2,
  },
  vetInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  vetInfoText: {
    flex: 1,
    fontSize: 12,
    color: '#E65100',
    lineHeight: 16,
  },
  farmerInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  farmerInfoText: {
    flex: 1,
    fontSize: 12,
    color: '#2E7D32',
    lineHeight: 16,
  },
  vetFieldsContainer: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  vetFieldsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B5E20',
    marginBottom: 12,
  },
  registerButton: {
    backgroundColor: '#2E7D32',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
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