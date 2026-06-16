// backend/src/types/auth.ts

// User roles
export type UserRole = 
  | 'farmer' 
  | 'veterinarian' 
  | 'super_admin' 
  | 'district_admin';

// User status
export type UserStatus = 
  | 'active' 
  | 'pending' 
  | 'suspended' 
  | 'deactivated';

// Verification status
export type VerificationStatus = 
  | 'verified' 
  | 'pending' 
  | 'unverified';

// User interface
export interface User {
  id: string | number;
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  is_verified: boolean;
  is_active: boolean;
  district_id?: number;
  province?: string;
  address?: string;
  profile_image?: string | null;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

// Farmer specific interface
export interface Farmer extends User {
  role: 'farmer';
  farm_name?: string;
  farm_size?: number;
  farm_location?: string;
  total_animals?: number;
  preferred_veterinarian?: number;
}

// Veterinarian specific interface
export interface Veterinarian extends User {
  role: 'veterinarian';
  license_number: string;
  specialization?: string;
  years_of_experience?: number;
  clinic_name?: string;
  clinic_address?: string;
  is_available: boolean;
  consultation_fee?: number;
  rating?: number;
  total_consultations?: number;
}

// Admin specific interface
export interface Admin extends User {
  role: 'super_admin' | 'district_admin';
  permissions: string[];
  district?: string;
}

// Auth state interface
export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hydrated: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setRefreshToken: (token: string | null) => void;
  setAuthenticated: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  setHydrated: (value: boolean) => void;
  
  // Complex actions
  login: (user: User, token: string, refreshToken?: string) => void;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  hydrate: () => Promise<void>;
}

// Login credentials
export interface LoginCredentials {
  login: string; // email or phone
  password: string;
}

// Register data
export interface RegisterData {
  full_name: string;
  phone: string;
  email: string;
  password: string;
  password_confirmation?: string;
  district_id: number;
  role?: UserRole;
}

// Register response
export interface RegisterResponse {
  success: boolean;
  message: string;
  user?: User;
  requires_verification?: boolean;
}

// Login response
export interface LoginResponse {
  success: boolean;
  token: string;
  refreshToken?: string;
  user: User;
  message?: string;
}

// Forgot password data
export interface ForgotPasswordData {
  email: string;
}

// Reset password data
export interface ResetPasswordData {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}

// Change password data
export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

// Verify email data
export interface VerifyEmailData {
  token: string;
}

// Resend verification data
export interface ResendVerificationData {
  email: string;
}

// Update profile data
export interface UpdateProfileData {
  full_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  profile_image?: string;
  farm_name?: string;
  farm_location?: string;
}

// Update profile response
export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  user: User;
}

// Auth response (generic)
export interface AuthResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Session info
export interface SessionInfo {
  user: User;
  expires_at: string;
  last_activity: string;
}

// Helper functions
export const getUserDisplayName = (user: User | null): string => {
  if (!user) return 'Guest';
  return user.full_name?.split(' ')[0] || user.full_name || 'User';
};

export const getUserRoleDisplayName = (role: UserRole): string => {
  const roleNames: Record<UserRole, string> = {
    farmer: 'Farmer',
    veterinarian: 'Veterinarian',
    super_admin: 'Super Admin',
    district_admin: 'District Admin',
  };
  return roleNames[role];
};

export const getUserInitials = (user: User | null): string => {
  if (!user || !user.full_name) return '?';
  return user.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const getDashboardRouteByRole = (role: UserRole): string => {
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

export const getDefaultTabByRole = (role: UserRole): string => {
  switch (role) {
    case 'farmer':
      return 'index';
    case 'veterinarian':
      return 'index';
    case 'super_admin':
    case 'district_admin':
      return 'index';
    default:
      return 'index';
  }
};

export const isFarmer = (user: User | null): boolean => {
  return user?.role === 'farmer';
};

export const isVeterinarian = (user: User | null): boolean => {
  return user?.role === 'veterinarian';
};

export const isAdmin = (user: User | null): boolean => {
  return user?.role === 'super_admin' || user?.role === 'district_admin';
};

export const isSuperAdmin = (user: User | null): boolean => {
  return user?.role === 'super_admin';
};

export const isAccountActive = (user: User | null): boolean => {
  return user?.status === 'active' && user?.is_active === true;
};

export const isAccountVerified = (user: User | null): boolean => {
  return user?.is_verified === true;
};

// Validation functions
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

// ✅ FIXED: Export helper functions as an object, not types
// Types and interfaces are already exported with 'export' keyword above
export const authHelpers = {
  getUserDisplayName,
  getUserRoleDisplayName,
  getUserInitials,
  getDashboardRouteByRole,
  getDefaultTabByRole,
  isFarmer,
  isVeterinarian,
  isAdmin,
  isSuperAdmin,
  isAccountActive,
  isAccountVerified,
  validatePhoneNumber,
  validateEmail,
  validatePassword,
};

// Default export for helper functions only (optional)
// Do NOT include types in default export
export default authHelpers;