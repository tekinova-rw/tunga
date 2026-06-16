// src/services/auth-service.ts
import { api } from '../api/axios';

// Types
export type LoginCredentials = {
  login: string; // email or phone
  password: string;
};

export type RegisterData = {
  full_name: string;
  phone: string;
  email: string;
  password: string;
  password_confirmation?: string;
  district_id: number;
  role?: 'farmer' | 'veterinarian';
};

export type ForgotPasswordData = {
  email: string;
};

export type ResetPasswordData = {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
};

export type ChangePasswordData = {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
};

export type VerifyEmailData = {
  token: string;
};

export type AuthResponse = {
  success: boolean;
  token: string;
  refreshToken?: string;
  user: {
    id: string;
    full_name: string;
    phone: string;
    email: string;
    role: string;
    district_id: number;
    is_verified: boolean;
    status: string;
    profile_image?: string;
    created_at: string;
  };
  message?: string;
};

export type ApiResponse = {
  success: boolean;
  message: string;
  data?: any;
};

// Authentication Functions
export const loginUser = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  } catch (error: any) {
    console.error('Login error:', error?.response?.data);
    throw error;
  }
};

export const registerUser = async (data: RegisterData): Promise<AuthResponse> => {
  try {
    const response = await api.post('/auth/register', data);
    return response.data;
  } catch (error: any) {
    console.error('Register error:', error?.response?.data);
    throw error;
  }
};

export const logoutUser = async (refreshToken?: string): Promise<ApiResponse> => {
  try {
    const response = await api.post('/auth/logout', { refreshToken });
    return response.data;
  } catch (error: any) {
    console.error('Logout error:', error?.response?.data);
    throw error;
  }
};

export const refreshAccessToken = async (refreshToken: string): Promise<{ token: string }> => {
  try {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  } catch (error: any) {
    console.error('Refresh token error:', error?.response?.data);
    throw error;
  }
};

export const forgotPassword = async (data: ForgotPasswordData): Promise<ApiResponse> => {
  try {
    const response = await api.post('/auth/forgot-password', data);
    return response.data;
  } catch (error: any) {
    console.error('Forgot password error:', error?.response?.data);
    throw error;
  }
};

export const resetPassword = async (data: ResetPasswordData): Promise<ApiResponse> => {
  try {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  } catch (error: any) {
    console.error('Reset password error:', error?.response?.data);
    throw error;
  }
};

export const changePassword = async (data: ChangePasswordData): Promise<ApiResponse> => {
  try {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  } catch (error: any) {
    console.error('Change password error:', error?.response?.data);
    throw error;
  }
};

export const verifyEmail = async (data: VerifyEmailData): Promise<ApiResponse> => {
  try {
    const response = await api.get(`/auth/verify/${data.token}`);
    return response.data;
  } catch (error: any) {
    console.error('Verify email error:', error?.response?.data);
    throw error;
  }
};

export const resendVerificationEmail = async (email: string): Promise<ApiResponse> => {
  try {
    const response = await api.post('/auth/resend-verification', { email });
    return response.data;
  } catch (error: any) {
    console.error('Resend verification error:', error?.response?.data);
    throw error;
  }
};

// Profile Functions
export const getProfile = async (): Promise<AuthResponse['user']> => {
  try {
    const response = await api.get('/auth/profile');
    return response.data.data || response.data;
  } catch (error: any) {
    console.error('Get profile error:', error?.response?.data);
    throw error;
  }
};

export const updateProfile = async (data: {
  full_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  profile_image?: string;
}): Promise<AuthResponse['user']> => {
  try {
    const response = await api.put('/auth/profile', data);
    return response.data.data || response.data;
  } catch (error: any) {
    console.error('Update profile error:', error?.response?.data);
    throw error;
  }
};

export const uploadProfileImage = async (imageUri: string): Promise<{ profile_image: string }> => {
  try {
    const formData = new FormData();
    formData.append('profile_image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    } as any);
    
    const response = await api.post('/auth/upload-profile-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Upload profile image error:', error?.response?.data);
    throw error;
  }
};

// Validation Helpers
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^07[2389][0-9]{7}$/;
  return phoneRegex.test(phone);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

// Role-based helpers
export const getUserRole = (role: string): string => {
  switch (role) {
    case 'farmer':
      return 'Farmer';
    case 'veterinarian':
      return 'Veterinarian';
    case 'super_admin':
      return 'Super Admin';
    case 'district_admin':
      return 'District Admin';
    default:
      return 'User';
  }
};

export const getDashboardRoute = (role: string): string => {
  switch (role) {
    case 'farmer':
      return '/(farmer)/dashboard';
    case 'veterinarian':
      return '/(vet)/dashboard';
    case 'super_admin':
    case 'district_admin':
      return '/(admin)/dashboard';
    default:
      return '/(auth)/login';
  }
};

// Session management
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
};

export const getTokenExpiration = (token: string): Date | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    return new Date(exp * 1000);
  } catch {
    return null;
  }
};

// Export all functions as a service object
const authService = {
  loginUser,
  registerUser,
  logoutUser,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
  resendVerificationEmail,
  getProfile,
  updateProfile,
  uploadProfileImage,
  validatePhoneNumber,
  validateEmail,
  validatePassword,
  getUserRole,
  getDashboardRoute,
  isTokenExpired,
  getTokenExpiration,
};

export default authService;