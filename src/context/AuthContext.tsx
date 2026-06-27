// ============================================================
// FILE: src/context/AuthContext.tsx
// DESCRIPTION: Auth context for React Native
// ============================================================

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/services/api';
import { router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

// Types
interface User {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  role: string;
  district_id: number | null;
  status: string;
  is_verified: boolean;
  is_active: boolean;
  profile_image?: string | null;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  refreshToken: () => Promise<string | null>;
  hydrate: () => Promise<void>;
}

interface RegisterData {
  full_name: string;
  phone: string;
  email: string;
  password: string;
  role?: string;
  district_id?: number | null;
}

interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    user: User;
  };
}

// ✅ Platform-specific storage helper
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      // Try SecureStore first, fallback to AsyncStorage
      try {
        return await SecureStore.getItemAsync(key);
      } catch {
        return await AsyncStorage.getItem(key);
      }
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
        return;
      }
      try {
        await SecureStore.setItemAsync(key, value);
      } catch {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
        return;
      }
      try {
        await SecureStore.deleteItemAsync(key);
      } catch {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
    }
  },
  multiRemove: async (keys: string[]): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        keys.forEach(key => localStorage.removeItem(key));
        return;
      }
      for (const key of keys) {
        try {
          await SecureStore.deleteItemAsync(key);
        } catch {
          await AsyncStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Error removing items:', error);
    }
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Hydrate - load user from storage on mount
  const hydrate = async () => {
    try {
      setIsLoading(true);
      
      const storedToken = await storage.getItem('accessToken');
      const storedUser = await storage.getItem('user');
      const storedRefreshToken = await storage.getItem('refreshToken');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
        console.log('✅ Auth hydrated successfully');
      } else {
        console.log('ℹ️ No stored auth data found');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('❌ Hydrate error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Login
  const login = async (login: string, password: string) => {
    try {
      setIsLoading(true);
      
      const response = await api.post<LoginResponse>('/auth/login', { 
        login, 
        password 
      });
      
      const { data } = response.data;

      if (data.accessToken && data.user) {
        // Store tokens and user
        await storage.setItem('accessToken', data.accessToken);
        await storage.setItem('refreshToken', data.refreshToken);
        await storage.setItem('user', JSON.stringify(data.user));

        setToken(data.accessToken);
        setUser(data.user);
        setIsAuthenticated(true);

        console.log(`✅ Login successful for: ${data.user.full_name}`);
      } else {
        throw new Error('Invalid login response');
      }
    } catch (error: any) {
      console.error('❌ Login error:', error?.response?.data || error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      // Call logout API if needed
      if (token) {
        try {
          await api.post('/auth/logout', {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (e) {
          // Ignore logout API errors
        }
      }

      // Clear storage
      await storage.multiRemove(['accessToken', 'refreshToken', 'user']);

      setToken(null);
      setUser(null);
      setIsAuthenticated(false);

      // Redirect to login
      router.replace('/(auth)/login');
      
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Still clear local state even if API fails
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Register
  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true);
      
      const response = await api.post('/auth/register', data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Register error:', error?.response?.data || error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update user
  const updateUser = async (data: Partial<User>) => {
    try {
      if (!user) throw new Error('No user logged in');
      
      const response = await api.put(`/users/${user.id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const updatedUser = { ...user, ...response.data.data };
      
      await storage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      console.log('✅ User updated successfully');
    } catch (error: any) {
      console.error('❌ Update user error:', error?.response?.data || error.message);
      throw error;
    }
  };

  // Refresh token
  const refreshToken = async (): Promise<string | null> => {
    try {
      const refreshToken = await storage.getItem('refreshToken');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/auth/refresh-token', {
        refreshToken
      });

      const newAccessToken = response.data.data.accessToken;
      
      await storage.setItem('accessToken', newAccessToken);
      setToken(newAccessToken);
      
      return newAccessToken;
    } catch (error: any) {
      console.error('❌ Refresh token error:', error?.response?.data || error.message);
      // If refresh fails, logout
      await logout();
      return null;
    }
  };

  // Load user on mount
  useEffect(() => {
    hydrate();
  }, []);

  // Set up axios interceptor for token refresh
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If token expired and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const newToken = await refreshToken();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return api(originalRequest);
            }
          } catch (e) {
            // Refresh failed, logout
            await logout();
          }
        }
        
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, []);

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
    register,
    updateUser,
    refreshToken,
    hydrate,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// HOC to protect routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  return (props: P) => {
    const { isAuthenticated, isLoading } = useAuth();
    
    if (isLoading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      );
    }
    
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
      return null;
    }
    
    return <Component {...props} />;
  };
};

// Export default
export default AuthContext;